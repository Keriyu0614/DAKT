using MedicationService.Models;
using Microsoft.EntityFrameworkCore;

namespace MedicationService.Data;

/// <summary>
/// Seeds initial medication data for development and testing
/// </summary>
public static class DataSeeder
{
    /// <summary>
    /// Seeds the database with sample medications if none exist
    /// </summary>
    public static void SeedData(MedicationDbContext context, ILogger logger)
    {
        try
        {
            // Check if data already exists
            if (context.Medications.Any())
            {
                logger.LogInformation("Database already contains medications. Skipping seed.");
                return;
            }

            logger.LogInformation("Seeding medication data...");

            var now = DateTime.UtcNow;
            var today = DateTime.Today;

            // Sample medications for elderly users
            var medications = new List<Medication>
            {
                new Medication
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.Parse("33333333-3333-3333-3333-333333333333"), // elderly1
                    MedicationName = "Aspirin",
                    Dosage = "100mg",
                    Frequency = "Mỗi ngày 1 lần",
                    ScheduledTimes = "08:00",
                    Instructions = "Uống sau bữa ăn sáng",
                    StartDate = today.AddDays(-30),
                    EndDate = null,
                    CreatedAt = now,
                    UpdatedAt = now
                },
                new Medication
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.Parse("33333333-3333-3333-3333-333333333333"), // elderly1
                    MedicationName = "Metformin",
                    Dosage = "500mg",
                    Frequency = "Mỗi ngày 2 lần",
                    ScheduledTimes = "08:00, 20:00",
                    Instructions = "Uống cùng bữa ăn",
                    StartDate = today.AddDays(-60),
                    EndDate = null,
                    CreatedAt = now,
                    UpdatedAt = now
                },
                new Medication
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.Parse("33333333-3333-3333-3333-333333333333"), // elderly1
                    MedicationName = "Vitamin D3",
                    Dosage = "1000 IU",
                    Frequency = "Mỗi ngày 1 lần",
                    ScheduledTimes = "12:00",
                    Instructions = "Uống sau bữa trưa",
                    StartDate = today.AddDays(-15),
                    EndDate = today.AddDays(75),
                    CreatedAt = now,
                    UpdatedAt = now
                },
                new Medication
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.Parse("44444444-4444-4444-4444-444444444444"), // elderly2
                    MedicationName = "Amlodipine",
                    Dosage = "5mg",
                    Frequency = "Mỗi ngày 1 lần",
                    ScheduledTimes = "07:00",
                    Instructions = "Uống vào buổi sáng",
                    StartDate = today.AddDays(-45),
                    EndDate = null,
                    CreatedAt = now,
                    UpdatedAt = now
                },
                new Medication
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.Parse("44444444-4444-4444-4444-444444444444"), // elderly2
                    MedicationName = "Omeprazole",
                    Dosage = "20mg",
                    Frequency = "Mỗi ngày 1 lần",
                    ScheduledTimes = "07:30",
                    Instructions = "Uống trước bữa ăn sáng 30 phút",
                    StartDate = today.AddDays(-20),
                    EndDate = today.AddDays(40),
                    CreatedAt = now,
                    UpdatedAt = now
                },
                new Medication
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.Parse("55555555-5555-5555-5555-555555555555"), // elderly3
                    MedicationName = "Paracetamol",
                    Dosage = "500mg",
                    Frequency = "Khi cần thiết",
                    ScheduledTimes = "08:00, 14:00, 20:00",
                    Instructions = "Uống khi đau hoặc sốt, không quá 3 lần/ngày",
                    StartDate = today.AddDays(-5),
                    EndDate = today.AddDays(10),
                    CreatedAt = now,
                    UpdatedAt = now
                },
                new Medication
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.Parse("55555555-5555-5555-5555-555555555555"), // elderly3
                    MedicationName = "Calcium + Vitamin D",
                    Dosage = "1 viên",
                    Frequency = "Mỗi ngày 1 lần",
                    ScheduledTimes = "20:00",
                    Instructions = "Uống sau bữa tối",
                    StartDate = today.AddDays(-10),
                    EndDate = null,
                    CreatedAt = now,
                    UpdatedAt = now
                }
            };

            context.Medications.AddRange(medications);
            context.SaveChanges();

            logger.LogInformation($"Seeded {medications.Count} sample medications successfully!");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while seeding medication data.");
            throw;
        }
    }
}
