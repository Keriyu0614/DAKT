using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net.Http.Json;
using HealthTrackingService.Data;
using HealthTrackingService.Models;
using HealthTrackingService.Models.DTOs;
using HealthTrackingService.Services;

namespace HealthTrackingService.Controllers;

/// <summary>
/// RESTful API controller for managing health logs.
/// Supports self-recording by elderly users and automatic caregiver alerts.
/// </summary>
[ApiController]
[Route("api/health-logs")]
[Produces("application/json")]
public class HealthLogsController : ControllerBase
{
    private readonly HealthDbContext _context;
    private readonly ILogger<HealthLogsController> _logger;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    public HealthLogsController(
        HealthDbContext context,
        ILogger<HealthLogsController> logger,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration)
    {
        _context = context;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
    }

    /// <summary>
    /// Get all health logs
    /// </summary>
    /// <returns>List of all health logs</returns>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<HealthLogResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<HealthLogResponseDto>>> GetAll()
    {
        _logger.LogInformation("Retrieving all health logs");
        var healthLogs = await _context.HealthLogs.ToListAsync();
        var response = healthLogs.Select(HealthLogResponseDto.FromEntity);
        return Ok(response);
    }

    /// <summary>
    /// Get health logs for a specific user
    /// </summary>
    /// <param name="userId">The user ID</param>
    [HttpGet("user/{userId}")]
    [ProducesResponseType(typeof(IEnumerable<HealthLogResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<HealthLogResponseDto>>> GetByUserId(string userId)
    {
        _logger.LogInformation("Retrieving health logs for user: {UserId}", userId);
        var healthLogs = await _context.HealthLogs
            .Where(hl => hl.UserId == Guid.Parse(userId))
            .OrderByDescending(hl => hl.Date)
            .ToListAsync();
        var response = healthLogs.Select(HealthLogResponseDto.FromEntity);
        return Ok(response);
    }

    /// <summary>
    /// Get a specific health log by ID
    /// </summary>
    /// <param name="id">The health log ID</param>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(HealthLogResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<HealthLogResponseDto>> GetById(Guid id)
    {
        _logger.LogInformation("Retrieving health log with ID: {HealthLogId}", id);

        var healthLog = await _context.HealthLogs.FindAsync(id);
        if (healthLog == null)
        {
            _logger.LogWarning("Health log with ID {HealthLogId} not found", id);
            return NotFound(new { message = $"Health log with ID {id} not found" });
        }

        return Ok(HealthLogResponseDto.FromEntity(healthLog));
    }

    /// <summary>
    /// Create a new health log entry.
    /// Accepts systolic/diastolic as separate int fields (from mobile) OR combined "120/80" string (from web).
    /// Automatically sends caregiver alerts when metrics are out of safe range or when self-recorded.
    /// </summary>
    /// <param name="dto">The health log data</param>
    [HttpPost]
    [ProducesResponseType(typeof(HealthLogResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<HealthLogResponseDto>> Create([FromBody] CreateHealthLogDto dto)
    {
        _logger.LogInformation("Creating new health log for user {UserId} (recordedBy={RecordedBy})",
            dto.UserId, dto.RecordedBy);

        var bpString = ResolveBpString(dto);

        var now = DateTime.UtcNow;
        var healthLog = new HealthLog
        {
            Id = Guid.NewGuid(),
            UserId = dto.UserId,
            Date = dto.Date,
            BloodPressure = bpString,
            HeartRate = dto.HeartRate,
            Weight = dto.Weight,
            Note = dto.Note,
            RecordedBy = dto.RecordedBy ?? "caregiver",
            CreatedAt = now,
            UpdatedAt = now
        };

        _context.HealthLogs.Add(healthLog);
        await _context.SaveChangesAsync();

        // Fire-and-forget alert check — does not block response
        _ = Task.Run(() => CheckAndNotifyAsync(healthLog));

        var response = HealthLogResponseDto.FromEntity(healthLog);
        return CreatedAtAction(nameof(GetById), new { id = healthLog.Id }, response);
    }

    /// <summary>
    /// Update an existing health log (partial update support)
    /// </summary>
    /// <param name="id">The health log ID</param>
    /// <param name="dto">The updated health log data</param>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(HealthLogResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<HealthLogResponseDto>> Update(Guid id, [FromBody] UpdateHealthLogDto dto)
    {
        _logger.LogInformation("Updating health log with ID: {HealthLogId}", id);

        var healthLog = await _context.HealthLogs.FindAsync(id);
        if (healthLog == null)
        {
            _logger.LogWarning("Health log with ID {HealthLogId} not found", id);
            return NotFound(new { message = $"Health log with ID {id} not found" });
        }

        if (dto.Date.HasValue)
            healthLog.Date = dto.Date.Value;

        if (dto.BloodPressure != null)
            healthLog.BloodPressure = dto.BloodPressure;

        if (dto.HeartRate.HasValue)
            healthLog.HeartRate = dto.HeartRate;

        if (dto.Note != null)
            healthLog.Note = dto.Note;

        if (dto.Weight.HasValue)
            healthLog.Weight = dto.Weight;

        healthLog.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(HealthLogResponseDto.FromEntity(healthLog));
    }

    /// <summary>
    /// Delete a health log
    /// </summary>
    /// <param name="id">The health log ID</param>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id)
    {
        _logger.LogInformation("Deleting health log with ID: {HealthLogId}", id);

        var healthLog = await _context.HealthLogs.FindAsync(id);
        if (healthLog == null)
        {
            _logger.LogWarning("Health log with ID {HealthLogId} not found", id);
            return NotFound(new { message = $"Health log with ID {id} not found" });
        }

        _context.HealthLogs.Remove(healthLog);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Health log with ID {HealthLogId} deleted successfully", id);
        return NoContent();
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    /// <summary>
    /// Resolves BloodPressure string from DTO.
    /// Mobile sends systolic+diastolic separately; web sends combined "120/80".
    /// </summary>
    private static string ResolveBpString(CreateHealthLogDto dto)
    {
        if (dto.Systolic.HasValue && dto.Diastolic.HasValue)
            return $"{dto.Systolic}/{dto.Diastolic}";

        if (!string.IsNullOrWhiteSpace(dto.BloodPressure) && dto.BloodPressure != "-")
            return dto.BloodPressure;

        return "-";
    }

    /// <summary>
    /// Checks vital sign thresholds and sends caregiver notifications via NotificationService.
    /// Threshold rules: Systolic &gt;140 or &lt;90, Diastolic &gt;90 or &lt;60, HR &gt;100 or &lt;50.
    /// Always notifies caregiver when log is self-recorded (recordedBy == "self").
    /// </summary>
    private async Task CheckAndNotifyAsync(HealthLog log)
    {
        try
        {
            var alerts = new List<string>();

            if (log.BloodPressure != "-" && log.BloodPressure.Contains('/'))
            {
                var parts = log.BloodPressure.Split('/');
                if (int.TryParse(parts[0], out int sys) && int.TryParse(parts[1], out int dia))
                {
                    if (sys > 140 || sys < 90)
                        alerts.Add($"Huyết áp tâm thu {sys} mmHg ({(sys > 140 ? "quá cao" : "quá thấp")})");
                    if (dia > 90 || dia < 60)
                        alerts.Add($"Huyết áp tâm trương {dia} mmHg ({(dia > 90 ? "quá cao" : "quá thấp")})");
                }
            }

            if (log.HeartRate.HasValue)
            {
                var hr = log.HeartRate.Value;
                if (hr > 100 || hr < 50)
                    alerts.Add($"Nhịp tim {hr} bpm ({(hr > 100 ? "quá nhanh" : "quá chậm")})");
            }

            var isSelf = log.RecordedBy == "self";

            // Skip notification if no alerts and not self-recorded
            if (alerts.Count == 0 && !isSelf) return;

            // Resolve connected caregivers and elderly user details
            var connections = await FetchConnectionsAsync();
            var elderlyList = await FetchElderlyUsersAsync();

            var connectedCaregivers = connections?
                .Where(c => c.ElderlyId == log.UserId)
                .Select(c => c.CaregiverId)
                .ToList() ?? new List<Guid>();

            if (connectedCaregivers.Count == 0)
            {
                _logger.LogInformation("No caregivers connected to elderly user {UserId}. Skipping notification.", log.UserId);
                return;
            }

            var elderlyUser = elderlyList?.FirstOrDefault(e => e.Id == log.UserId);
            var elderlyName = elderlyUser?.Name ?? "Người cao tuổi";

            var notificationUrl = _configuration["NotificationServiceUrl"] ?? "http://localhost:5006";
            var client = _httpClientFactory.CreateClient();

            string title, message;
            if (alerts.Count > 0)
            {
                title = $"⚠️ Cảnh báo chỉ số bất thường: {elderlyName}";
                var selfTag = isSelf ? " (tự ghi)" : "";
                message = $"Người cao tuổi {elderlyName}{selfTag} có chỉ số cần chú ý: " + string.Join("; ", alerts);
            }
            else
            {
                // isSelf == true, all normal — routine caregiver inform
                title = $"📋 {elderlyName} vừa tự ghi chỉ số";
                var time = log.Date.ToLocalTime().ToString("HH:mm");
                var hrStr = log.HeartRate.HasValue ? $", nhịp tim {log.HeartRate} bpm" : "";
                var bpStr = log.BloodPressure != "-" ? $"huyết áp {log.BloodPressure} mmHg" : "";
                message = $"Đã ghi lúc {time}: {bpStr}{hrStr}";
            }

            foreach (var caregiverId in connectedCaregivers)
            {
                var payload = new
                {
                    UserId = caregiverId,
                    SourceReminderId = log.Id,
                    SourceEventType = 2,  // Health
                    SourceEventId = log.Id,
                    Title = title,
                    Message = message,
                    DeliveryChannel = 0,  // MobilePush
                    RecipientType = 1     // Caregiver
                };

                var httpResponse = await client.PostAsJsonAsync(
                    $"{notificationUrl}/api/notifications/internal", payload);

                if (!httpResponse.IsSuccessStatusCode)
                    _logger.LogWarning("Health notification failed for caregiver {CaregiverId}. Status: {Status}", caregiverId, httpResponse.StatusCode);
                else
                    _logger.LogInformation("Health notification sent for log {LogId} to caregiver {CaregiverId}", log.Id, caregiverId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending health notification for log {LogId}", log.Id);
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
}
