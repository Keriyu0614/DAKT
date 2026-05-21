using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuthService.Models;

/// <summary>
/// User-specific settings and preferences
/// </summary>
public class UserSettings
{
    [Key]
    public Guid UserId { get; set; }

    /// <summary>
    /// User's preferred language (e.g., "en", "vi")
    /// </summary>
    public string Language { get; set; } = "en";

    /// <summary>
    /// User's preferred theme (e.g., "light", "dark", "contrast")
    /// </summary>
    public string Theme { get; set; } = "light";

    /// <summary>
    /// Whether notifications are enabled globally
    /// </summary>
    public bool NotificationsEnabled { get; set; } = true;

    /// <summary>
    /// Whether to auto-logout after inactivity
    /// </summary>
    public bool AutoLogout { get; set; } = true;

    [ForeignKey("UserId")]
    public virtual User? User { get; set; }
}
