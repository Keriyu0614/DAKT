namespace AuthService.Models.DTOs;

public class LinkElderlyDto
{
    public string Email { get; set; } = string.Empty;
    public Guid CaregiverId { get; set; }
}
