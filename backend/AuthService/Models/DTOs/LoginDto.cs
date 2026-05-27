using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace AuthService.Models.DTOs;

/// <summary>
/// Data Transfer Object for user login
/// </summary>
public class LoginDto
{
    /// <summary>
    /// Email address
    /// </summary>
    [JsonPropertyName("email")]
    [Required]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Password
    /// </summary>
    [JsonPropertyName("password")]
    [Required]
    public string Password { get; set; } = string.Empty;
}
