using Microsoft.AspNetCore.Mvc;
using EmergencyService.Models;
using EmergencyService.Models.DTOs;
using EmergencyService.Services;
using System.Text.Json;

namespace EmergencyService.Controllers;

[ApiController]
[Route("api/emergency")]
[Produces("application/json")]
public class EmergencyController : ControllerBase
{
    private readonly RabbitMQPublisher _publisher;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmergencyController> _logger;

    public EmergencyController(
        RabbitMQPublisher publisher,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<EmergencyController> logger)
    {
        _publisher = publisher;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Trigger emergency alert — called by mobile app when user presses "GỌI HỖ TRỢ"
    /// Returns 202 immediately, processing happens async via RabbitMQ
    /// </summary>
    [HttpPost("trigger")]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> TriggerEmergency([FromBody] TriggerEmergencyDto dto)
    {
        if (dto.UserId == Guid.Empty)
            return BadRequest(new { message = "UserId is required" });

        _logger.LogWarning("🚨 EMERGENCY triggered by user {UserId}", dto.UserId);

        // Fetch elderly user name and connected caregivers from AuthService
        var (elderlyName, caregiverIds) = await FetchElderlyInfoAsync(dto.UserId);

        if (caregiverIds.Count == 0)
        {
            _logger.LogWarning("No caregivers found for elderly {UserId}. Emergency still published.", dto.UserId);
        }

        var emergencyEvent = new EmergencyEvent
        {
            ElderlyUserId = dto.UserId,
            ElderlyName = elderlyName,
            CaregiverIds = caregiverIds,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            Message = dto.Message ?? "Cần hỗ trợ khẩn cấp",
            TriggeredAt = DateTime.UtcNow
        };

        // Publish to RabbitMQ — non-blocking
        _publisher.PublishEmergencyEvent(emergencyEvent);

        return Accepted(new
        {
            message = "Tín hiệu cứu hộ đã được gửi. Người thân đang được thông báo.",
            eventId = emergencyEvent.EventId,
            notifiedCaregivers = caregiverIds.Count
        });
    }

    private async Task<(string name, List<Guid> caregiverIds)> FetchElderlyInfoAsync(Guid elderlyId)
    {
        try
        {
            var authUrl = _configuration["AuthServiceUrl"] ?? "http://localhost:5004";
            var client = _httpClientFactory.CreateClient();

            // Get elderly user name
            var elderlyRes = await client.GetAsync($"{authUrl}/api/auth/internal/elderly");
            string elderlyName = "Người cao tuổi";
            if (elderlyRes.IsSuccessStatusCode)
            {
                var elderlyList = await elderlyRes.Content.ReadFromJsonAsync<List<JsonElement>>();
                var match = elderlyList?.FirstOrDefault(e =>
                    e.TryGetProperty("id", out var idProp) &&
                    Guid.TryParse(idProp.GetString(), out var id) &&
                    id == elderlyId);
                if (match.HasValue && match.Value.TryGetProperty("name", out var nameProp))
                    elderlyName = nameProp.GetString() ?? elderlyName;
            }

            // Get connected caregivers
            var connRes = await client.GetAsync($"{authUrl}/api/auth/internal/connections");
            var caregiverIds = new List<Guid>();
            if (connRes.IsSuccessStatusCode)
            {
                var connections = await connRes.Content.ReadFromJsonAsync<List<JsonElement>>();
                if (connections != null)
                {
                    foreach (var conn in connections)
                    {
                        if (conn.TryGetProperty("elderlyId", out var eidProp) &&
                            Guid.TryParse(eidProp.GetString(), out var eid) &&
                            eid == elderlyId &&
                            conn.TryGetProperty("caregiverId", out var cidProp) &&
                            Guid.TryParse(cidProp.GetString(), out var cid))
                        {
                            caregiverIds.Add(cid);
                        }
                    }
                }
            }

            return (elderlyName, caregiverIds);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching elderly info for {ElderlyId}", elderlyId);
            return ("Người cao tuổi", new List<Guid>());
        }
    }
}
