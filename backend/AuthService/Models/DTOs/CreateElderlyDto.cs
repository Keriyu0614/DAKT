namespace AuthService.Models.DTOs;

public class CreateElderlyDto
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public Guid CaregiverId { get; set; }
}
