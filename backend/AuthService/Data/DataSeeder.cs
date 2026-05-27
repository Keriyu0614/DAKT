using AuthService.Models;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Data;

/// <summary>
/// Seeds initial data for development and testing purposes
/// </summary>
public static class DataSeeder
{
    /// <summary>
    /// Seeds the database with sample users if no users exist
    /// </summary>
    public static void SeedData(AuthDbContext context, ILogger logger)
    {
        try
        {
            // Check if data already exists
            if (context.Users.Any())
            {
                logger.LogInformation("Database already contains users. Skipping seed.");
                return;
            }

            logger.LogInformation("Seeding initial data...");

            var now = DateTime.UtcNow;

            // Create sample caregivers
            var caregiver1 = new User
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Name = "Nguyễn Văn An",
                Email = "caregiver1@example.com",
                Password = "123456",
                Role = UserRole.Caregiver,
                CreatedAt = now,
                AvatarUrl = null
            };

            var caregiver2 = new User
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                Name = "Trần Thị Bình",
                Email = "caregiver2@example.com",
                Password = "123456",
                Role = UserRole.Caregiver,
                CreatedAt = now,
                AvatarUrl = null
            };

            // Create sample elderly users
            var elderly1 = new User
            {
                Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                Name = "Lê Văn Cường",
                Email = "elderly1@example.com",
                Password = "123456",
                Role = UserRole.Elderly,
                CreatedAt = now,
                AvatarUrl = null
            };

            var elderly2 = new User
            {
                Id = Guid.Parse("44444444-4444-4444-4444-444444444444"),
                Name = "Phạm Thị Dung",
                Email = "elderly2@example.com",
                Password = "123456",
                Role = UserRole.Elderly,
                CreatedAt = now,
                AvatarUrl = null
            };

            var elderly3 = new User
            {
                Id = Guid.Parse("55555555-5555-5555-5555-555555555555"),
                Name = "Hoàng Văn Em",
                Email = "elderly3@example.com",
                Password = "123456",
                Role = UserRole.Elderly,
                CreatedAt = now,
                AvatarUrl = null
            };

            // Add users to context
            context.Users.AddRange(caregiver1, caregiver2, elderly1, elderly2, elderly3);

            // Create user connections (caregivers managing elderly)
            var connection1 = new UserConnection
            {
                Id = Guid.NewGuid(),
                CaregiverId = caregiver1.Id,
                ElderlyId = elderly1.Id,
                ConnectedAt = now
            };

            var connection2 = new UserConnection
            {
                Id = Guid.NewGuid(),
                CaregiverId = caregiver1.Id,
                ElderlyId = elderly2.Id,
                ConnectedAt = now
            };

            var connection3 = new UserConnection
            {
                Id = Guid.NewGuid(),
                CaregiverId = caregiver2.Id,
                ElderlyId = elderly3.Id,
                ConnectedAt = now
            };

            context.UserConnections.AddRange(connection1, connection2, connection3);

            // Create user settings
            var settings1 = new UserSettings
            {
                UserId = caregiver1.Id,
                NotificationsEnabled = true,
                Language = "vi",
                Theme = "light"
            };

            var settings2 = new UserSettings
            {
                UserId = elderly1.Id,
                NotificationsEnabled = true,
                Language = "vi",
                Theme = "light"
            };

            context.UserSettings.AddRange(settings1, settings2);

            // Save all changes
            context.SaveChanges();

            logger.LogInformation("Sample data seeded successfully!");
            logger.LogInformation("Sample accounts:");
            logger.LogInformation("  Caregiver: caregiver1@example.com / 123456");
            logger.LogInformation("  Caregiver: caregiver2@example.com / 123456");
            logger.LogInformation("  Elderly: elderly1@example.com / 123456");
            logger.LogInformation("  Elderly: elderly2@example.com / 123456");
            logger.LogInformation("  Elderly: elderly3@example.com / 123456");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while seeding data.");
            throw;
        }
    }
}
