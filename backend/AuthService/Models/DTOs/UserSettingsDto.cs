namespace AuthService.Models.DTOs;

/// <summary>
/// Data Transfer Object for user settings
/// </summary>
public class UserSettingsDto
{
    public string Language { get; set; } = "en";
    public string Theme { get; set; } = "light";
    public bool NotificationsEnabled { get; set; } = true;
    public bool AutoLogout { get; set; } = true;

    public static UserSettingsDto FromEntity(UserSettings entity)
    {
        return new UserSettingsDto
        {
            Language = entity.Language,
            Theme = entity.Theme,
            NotificationsEnabled = entity.NotificationsEnabled,
            AutoLogout = entity.AutoLogout
        };
    }
}
