namespace AuthService.Models.DTOs;

/// <summary>
/// Data Transfer Object for updating user profile
/// </summary>
public class UpdateProfileDto
{
    /// <summary>
    /// User's full name
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// User's avatar URL (optional)
    /// </summary>
    public string? AvatarUrl { get; set; }
}
