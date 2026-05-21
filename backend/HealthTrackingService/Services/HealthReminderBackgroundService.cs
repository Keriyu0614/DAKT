using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using HealthTrackingService.Data;

namespace HealthTrackingService.Services;

public class HealthReminderBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<HealthReminderBackgroundService> _logger;

    private DateTime? _lastDailyReminderDate;
    private DateTime? _lastMissedEntryAlertDate;

    public HealthReminderBackgroundService(
        IServiceProvider serviceProvider,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<HealthReminderBackgroundService> _loggerInstance)
    {
        _serviceProvider = serviceProvider;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = _loggerInstance;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("HealthReminderBackgroundService started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var localNow = DateTime.Now;

                // Trigger daily reminder at 8:00 AM
                if (localNow.Hour == 8 && (!_lastDailyReminderDate.HasValue || _lastDailyReminderDate.Value.Date < localNow.Date))
                {
                    _logger.LogInformation("Daily reminder trigger activated at {Time}", localNow);
                    await RunDailyReminderCheckAsync(localNow);
                    _lastDailyReminderDate = localNow.Date;
                }

                // Trigger missed entry alert at 9:00 AM
                if (localNow.Hour == 9 && (!_lastMissedEntryAlertDate.HasValue || _lastMissedEntryAlertDate.Value.Date < localNow.Date))
                {
                    _logger.LogInformation("Missed entry alert trigger activated at {Time}", localNow);
                    await RunMissedEntryAlertCheckAsync(localNow);
                    _lastMissedEntryAlertDate = localNow.Date;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred in HealthReminderBackgroundService execution loop.");
            }

            // Check every 30 seconds
            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        }
    }

    public async Task RunDailyReminderCheckAsync(DateTime localNow)
    {
        try
        {
            var startOfToday = localNow.Date;
            var endOfToday = startOfToday.AddDays(1);
            var utcStart = startOfToday.ToUniversalTime();
            var utcEnd = endOfToday.ToUniversalTime();

            List<Guid> loggedUserIds;
            using (var scope = _serviceProvider.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<HealthDbContext>();
                loggedUserIds = await dbContext.HealthLogs
                    .Where(log => log.Date >= utcStart && log.Date < utcEnd)
                    .Select(log => log.UserId)
                    .Distinct()
                    .ToListAsync();
            }

            var elderlyList = await FetchElderlyUsersAsync();
            if (elderlyList == null || !elderlyList.Any())
            {
                _logger.LogInformation("Daily reminder check: No elderly users found in AuthService.");
                return;
            }

            var loggedUserIdsSet = loggedUserIds.ToHashSet();
            var pendingElderly = elderlyList.Where(e => !loggedUserIdsSet.Contains(e.Id)).ToList();

            _logger.LogInformation("Daily reminder check: Found {PendingCount} elderly users who haven't logged today.", pendingElderly.Count);

            foreach (var elderly in pendingElderly)
            {
                await SendNotificationAsync(
                    userId: elderly.Id,
                    title: "⏰ Nhắc nhở đo chỉ số sức khỏe hàng ngày",
                    message: $"Chào bạn {elderly.Name}, đừng quên đo và tự ghi nhận chỉ số huyết áp, nhịp tim hôm nay nhé!",
                    recipientType: 0 // ElderlyUser
                );
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error running RunDailyReminderCheckAsync");
        }
    }

    public async Task RunMissedEntryAlertCheckAsync(DateTime localNow)
    {
        try
        {
            var startOfToday = localNow.Date;
            var endOfToday = startOfToday.AddDays(1);
            var utcStart = startOfToday.ToUniversalTime();
            var utcEnd = endOfToday.ToUniversalTime();

            List<Guid> loggedUserIds;
            using (var scope = _serviceProvider.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<HealthDbContext>();
                loggedUserIds = await dbContext.HealthLogs
                    .Where(log => log.Date >= utcStart && log.Date < utcEnd)
                    .Select(log => log.UserId)
                    .Distinct()
                    .ToListAsync();
            }

            var elderlyList = await FetchElderlyUsersAsync();
            if (elderlyList == null || !elderlyList.Any())
            {
                _logger.LogInformation("Missed entry alert check: No elderly users found in AuthService.");
                return;
            }

            var connectionsList = await FetchConnectionsAsync();
            var loggedUserIdsSet = loggedUserIds.ToHashSet();
            var pendingElderly = elderlyList.Where(e => !loggedUserIdsSet.Contains(e.Id)).ToList();

            _logger.LogInformation("Missed entry alert check: Found {PendingCount} elderly users who haven't logged today.", pendingElderly.Count);

            foreach (var elderly in pendingElderly)
            {
                // Send alert to Elderly
                await SendNotificationAsync(
                    userId: elderly.Id,
                    title: "⚠️ Cảnh báo nhỡ đo chỉ số sức khỏe",
                    message: "Hôm nay bạn chưa ghi nhận chỉ số sức khỏe nào lúc 9:00 sáng. Hãy đo ngay nhé!",
                    recipientType: 0 // ElderlyUser
                );

                // Send alert to Caregivers
                if (connectionsList != null)
                {
                    var caregivers = connectionsList
                        .Where(c => c.ElderlyId == elderly.Id)
                        .Select(c => c.CaregiverId)
                        .ToList();

                    foreach (var caregiverId in caregivers)
                    {
                        await SendNotificationAsync(
                            userId: caregiverId,
                            title: $"⚠️ Cảnh báo: {elderly.Name} chưa đo chỉ số",
                            message: $"Hôm nay {elderly.Name} chưa ghi nhận chỉ số sức khỏe nào lúc 9:00 sáng.",
                            recipientType: 1 // Caregiver
                        );
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error running RunMissedEntryAlertCheckAsync");
        }
    }

    private async Task<List<AuthUserDto>?> FetchElderlyUsersAsync()
    {
        try
        {
            var authUrl = _configuration["AuthServiceUrl"] ?? "http://localhost:5004";
            var client = _httpClientFactory.CreateClient();
            var response = await client.GetAsync($"{authUrl}/api/auth/internal/elderly");
            if (response.IsSuccessStatusCode)
            {
                return await response.Content.ReadFromJsonAsync<List<AuthUserDto>>();
            }
            _logger.LogWarning("Fetch elderly users from Auth service failed: {Status}", response.StatusCode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching elderly users from Auth service");
        }
        return null;
    }

    private async Task<List<AuthConnectionDto>?> FetchConnectionsAsync()
    {
        try
        {
            var authUrl = _configuration["AuthServiceUrl"] ?? "http://localhost:5004";
            var client = _httpClientFactory.CreateClient();
            var response = await client.GetAsync($"{authUrl}/api/auth/internal/connections");
            if (response.IsSuccessStatusCode)
            {
                return await response.Content.ReadFromJsonAsync<List<AuthConnectionDto>>();
            }
            _logger.LogWarning("Fetch connections from Auth service failed: {Status}", response.StatusCode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching connections from Auth service");
        }
        return null;
    }

    private async Task SendNotificationAsync(Guid userId, string title, string message, int recipientType)
    {
        try
        {
            var notificationUrl = _configuration["NotificationServiceUrl"] ?? "http://localhost:5006";
            var client = _httpClientFactory.CreateClient();

            var payload = new
            {
                UserId = userId,
                SourceReminderId = Guid.Empty, // System generated reminder
                SourceEventType = 2,  // Health
                SourceEventId = Guid.Empty,
                Title = title,
                Message = message,
                DeliveryChannel = 0,  // MobilePush
                RecipientType = recipientType
            };

            var httpResponse = await client.PostAsJsonAsync(
                $"{notificationUrl}/api/notifications/internal", payload);

            if (!httpResponse.IsSuccessStatusCode)
            {
                _logger.LogWarning("Scheduled notification failed. Status: {Status}", httpResponse.StatusCode);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending scheduled notification");
        }
    }
}

public class AuthUserDto
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
}

public class AuthConnectionDto
{
    public Guid CaregiverId { get; set; }
    public Guid ElderlyId { get; set; }
}
