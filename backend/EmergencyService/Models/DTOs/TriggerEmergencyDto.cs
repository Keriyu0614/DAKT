namespace EmergencyService.Models.DTOs;

public class TriggerEmergencyDto
{
    public Guid UserId { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string? Message { get; set; }
}
