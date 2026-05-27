using HealthTrackingService.Models;
using Microsoft.EntityFrameworkCore;

namespace HealthTrackingService.Data;

/// <summary>
/// Seeds initial health tracking data for development and testing
/// </summary>
public static class DataSeeder
{
    /// <summary>
    /// Seeds the database with sample health logs if none exist
    /// </summary>
    public static void SeedData(HealthDbContext context, ILogger logger)
    {
        try
        {
            // Check if data already exists
            if (context.HealthLogs.Any())
            {
                logger.LogInformation("Database already contains health logs. Skipping seed.");
                return;
            }

            logger.LogInformation("Seeding health tracking data...");

            var now = DateTime.UtcNow;
            var today = DateTime.Today;

            // Sample health logs for elderly users
            var healthLogs = new List<HealthLog>
            {
                // elderly1 - last 7 days
                new HealthLog
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                    Date = today.AddDays(-6),
                    BloodPressure = "120/80",
                    HeartRate = 72,
                    Weight = 65.5,
                    Note = "Cảm thấy khỏe",
                    RecordedBy = "caregiver",
                    CreatedAt = now.AddDays(-6),
                    UpdatedAt = now.AddDays(-6)
                },
                new HealthLog
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                    Date = today.AddDays(-5),
                    BloodPressure = "118/78",
                    HeartRate = 70,
                    Weight = 65.3,
                    Note = "Bình thường",
                    RecordedBy = "caregiver",
                    CreatedAt = now.AddDays(-5),
                    UpdatedAt = now.AddDays(-5)
                },
                new HealthLog
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                    Date = today.AddDays(-4),
                    BloodPressure = "122/82",
                    HeartRate = 75,
                    Weight = 65.4,
                    Note = "Hơi mệt",
                    RecordedBy = "caregiver",
                    CreatedAt = now.AddDays(-4),
                    UpdatedAt = now.AddDays(-4)
                },
                new HealthLog
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                    Date = today.AddDays(-3),
                    BloodPressure = "119/79",
                    HeartRate = 71,
                    Weight = 65.6,
                    Note = "Tốt",
                    RecordedBy = "caregiver",
                    CreatedAt = now.AddDays(-3),
                    UpdatedAt = now.AddDays(-3)
                },
                new HealthLog
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                    Date = today.AddDays(-2),
                    BloodPressure = "121/81",
                    HeartRate = 73,
                    Weight = 65.5,
                    Note = "Bình thường",
                    RecordedBy = "caregiver",
                    CreatedAt = now.AddDays(-2),
                    UpdatedAt = now.AddDays(-2)
                },
                new HealthLog
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                    Date = today.AddDays(-1),
                    BloodPressure = "120/80",
                    HeartRate = 72,
                    Weight = 65.7,
                    Note = "Khỏe mạnh",
                    RecordedBy = "caregiver",
                    CreatedAt = now.AddDays(-1),
                    UpdatedAt = now.AddDays(-1)
                },
                new HealthLog
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                    Date = today,
                    BloodPressure = "118/78",
                    HeartRate = 70,
                    Weight = 65.6,
                    Note = "Tốt",
                    RecordedBy = "caregiver",
                    CreatedAt = now,
                    UpdatedAt = now
                },
                
                // elderly2 - last 5 days
                new HealthLog
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.Parse("44444444-4444-4444-4444-444444444444"),
                    Date = today.AddDays(-4),
                    BloodPressure = "130/85",
                    HeartRate = 78,
                    Weight = 58.2,
                    Note = "Huyết áp hơi cao",
                    RecordedBy = "caregiver",
                    CreatedAt = now.AddDays(-4),
                    UpdatedAt = now.AddDays(-4)
                },
                new HealthLog
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.Parse("44444444-4444-4444-4444-444444444444"),
                    Date = today.AddDays(-3),
                    BloodPressure = "128/83",
                    HeartRate = 76,
                    Weight = 58.1,
                    Note = "Đã uống thuốc đều",
                    RecordedBy = "caregiver",
                    CreatedAt = now.AddDays(-3),
                    UpdatedAt = now.AddDays(-3)
                },
                new HealthLog
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.Parse("44444444-4444-4444-4444-444444444444"),
                    Date = today.AddDays(-2),
                    BloodPressure = "125/82",
                    HeartRate = 74,
                    Weight = 58.3,
                    Note = "Cải thiện",
                    RecordedBy = "caregiver",
                    CreatedAt = now.AddDays(-2),
                    UpdatedAt = now.AddDays(-2)
                },
                new HealthLog
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.Parse("44444444-4444-4444-4444-444444444444"),
                    Date = today.AddDays(-1),
                    BloodPressure = "124/81",
                    HeartRate = 73,
                    Weight = 58.2,
                    Note = "Tốt hơn",
                    RecordedBy = "caregiver",
                    CreatedAt = now.AddDays(-1),
                    UpdatedAt = now.AddDays(-1)
                },
                new HealthLog
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.Parse("44444444-4444-4444-4444-444444444444"),
                    Date = today,
                    BloodPressure = "122/80",
                    HeartRate = 72,
                    Weight = 58.4,
                    Note = "Ổn định",
                    RecordedBy = "caregiver",
                    CreatedAt = now,
                    UpdatedAt = now
                },
                
                // elderly3 - last 3 days
                new HealthLog
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.Parse("55555555-5555-5555-5555-555555555555"),
                    Date = today.AddDays(-2),
                    BloodPressure = "115/75",
                    HeartRate = 68,
                    Weight = 72.5,
                    Note = "Khỏe mạnh",
                    RecordedBy = "caregiver",
                    CreatedAt = now.AddDays(-2),
                    UpdatedAt = now.AddDays(-2)
                },
                new HealthLog
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.Parse("55555555-5555-5555-5555-555555555555"),
                    Date = today.AddDays(-1),
                    BloodPressure = "116/76",
                    HeartRate = 69,
                    Weight = 72.6,
                    Note = "Bình thường",
                    RecordedBy = "caregiver",
                    CreatedAt = now.AddDays(-1),
                    UpdatedAt = now.AddDays(-1)
                },
                new HealthLog
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.Parse("55555555-5555-5555-5555-555555555555"),
                    Date = today,
                    BloodPressure = "117/77",
                    HeartRate = 70,
                    Weight = 72.7,
                    Note = "Tốt",
                    RecordedBy = "caregiver",
                    CreatedAt = now,
                    UpdatedAt = now
                }
            };

            context.HealthLogs.AddRange(healthLogs);
            context.SaveChanges();

            logger.LogInformation($"Seeded {healthLogs.Count} sample health logs successfully!");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while seeding health tracking data.");
            throw;
        }
    }
}
