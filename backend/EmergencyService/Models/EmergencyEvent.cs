namespace EmergencyService.Models;

public class EmergencyEvent
{
    public Guid EventId { get; set; } = Guid.NewGuid();
    public Guid ElderlyUserId { get; set; }
    public string ElderlyName { get; set; } = string.Empty;
    public List<Guid> CaregiverIds { get; set; } = new();
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string Message { get; set; } = "Cần hỗ trợ khẩn cấp";
    public DateTime TriggeredAt { get; set; } = DateTime.UtcNow;
}
