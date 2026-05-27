using AppointmentService.Models;
using Microsoft.EntityFrameworkCore;

namespace AppointmentService.Data;

/// <summary>
/// Seeds initial appointment data for development and testing
/// </summary>
public static class DataSeeder
{
    /// <summary>
    /// Seeds the database with sample appointments if none exist
    /// </summary>
    public static void SeedData(AppointmentDbContext context, ILogger logger)
    {
        try
        {
            // Check if data already exists
            if (context.Appointments.Any())
            {
                logger.LogInformation("Database already contains appointments. Skipping seed.");
                return;
            }

            logger.LogInformation("Seeding appointment data...");

            var now = DateTime.UtcNow;
            var today = DateTime.Today;

            // Sample appointments for elderly users
            var appointments = new List<Appointment>
            {
                new Appointment
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.Parse("33333333-3333-3333-3333-333333333333"), // elderly1
                    DoctorName = "Bác sĩ Nguyễn Thị Lan",
                    Location = "Bệnh viện Đa khoa Trung ương",
                    AppointmentDate = today.AddDays(2).AddHours(9),
                    Notes = "Khám định kỳ tim mạch",
                    CreatedAt = now,
                    UpdatedAt = now
                },
                new Appointment
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.Parse("33333333-3333-3333-3333-333333333333"), // elderly1
                    DoctorName = "Bác sĩ Trần Văn Minh",
                    Location = "Phòng khám Đa khoa Quận 1",
                    AppointmentDate = today.AddDays(7).AddHours(14),
                    Notes = "Tái khám sau điều trị",
                    CreatedAt = now,
                    UpdatedAt = now
                },
                new Appointment
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.Parse("44444444-4444-4444-4444-444444444444"), // elderly2
                    DoctorName = "Bác sĩ Lê Thị Hoa",
                    Location = "Bệnh viện Nhi đồng 1",
                    AppointmentDate = today.AddDays(3).AddHours(10).AddMinutes(30),
                    Notes = "Khám xương khớp",
                    CreatedAt = now,
                    UpdatedAt = now
                },
                new Appointment
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.Parse("44444444-4444-4444-4444-444444444444"), // elderly2
                    DoctorName = "Bác sĩ Phạm Văn Đức",
                    Location = "Bệnh viện Chợ Rẫy",
                    AppointmentDate = today.AddDays(10).AddHours(8).AddMinutes(30),
                    Notes = "Khám mắt định kỳ",
                    CreatedAt = now,
                    UpdatedAt = now
                },
                new Appointment
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.Parse("55555555-5555-5555-5555-555555555555"), // elderly3
                    DoctorName = "Bác sĩ Hoàng Thị Mai",
                    Location = "Phòng khám Gia đình",
                    AppointmentDate = today.AddDays(5).AddHours(15),
                    Notes = "Khám tổng quát",
                    CreatedAt = now,
                    UpdatedAt = now
                }
            };

            context.Appointments.AddRange(appointments);
            context.SaveChanges();

            logger.LogInformation($"Seeded {appointments.Count} sample appointments successfully!");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while seeding appointment data.");
            throw;
        }
    }
}
