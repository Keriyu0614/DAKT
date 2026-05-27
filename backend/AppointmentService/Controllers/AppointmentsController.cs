using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Net.Http.Json;
using AppointmentService.Data;
using AppointmentService.Models;
using AppointmentService.Models.DTOs;
using OfficeOpenXml;

namespace AppointmentService.Controllers;

/// <summary>
/// RESTful API controller for managing appointments.
/// This is a minimal implementation with in-memory storage for demonstration purposes.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AppointmentsController : ControllerBase
{
    private readonly AppointmentDbContext _context;
    private readonly ILogger<AppointmentsController> _logger;
    private readonly IHttpClientFactory _httpClientFactory;

    private record ReminderReferenceDto(Guid Id, int Type, Guid ReferenceId);

    public AppointmentsController(AppointmentDbContext context, ILogger<AppointmentsController> logger, IHttpClientFactory httpClientFactory)
    {
        _context = context;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
    }

    /// <summary>
    /// Get all appointments
    /// </summary>
    /// <returns>List of all appointments</returns>
    /// <response code="200">Returns the list of appointments</response>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<AppointmentResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<AppointmentResponseDto>>> GetAll([FromQuery] Guid? userId)
    {
        _logger.LogInformation("Retrieving appointments. UserId filter: {UserId}", userId);
        
        IQueryable<Appointment> query = _context.Appointments;
        
        if (userId.HasValue)
        {
            query = query.Where(a => a.UserId == userId.Value);
        }

        var appointments = await query.ToListAsync();
        var response = appointments.Select(AppointmentResponseDto.FromEntity);
        return Ok(response);
    }

    /// <summary>
    /// Get a specific appointment by ID
    /// </summary>
    /// <param name="id">The appointment ID</param>
    /// <returns>The appointment if found</returns>
    /// <response code="200">Returns the appointment</response>
    /// <response code="404">If the appointment is not found</response>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(AppointmentResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AppointmentResponseDto>> GetById(Guid id)
    {
        _logger.LogInformation("Retrieving appointment with ID: {AppointmentId}", id);
        
        var appointment = await _context.Appointments.FindAsync(id);
        if (appointment == null)
        {
            _logger.LogWarning("Appointment with ID {AppointmentId} not found", id);
            return NotFound(new { message = $"Appointment with ID {id} not found" });
        }

        return Ok(AppointmentResponseDto.FromEntity(appointment));
    }

    /// <summary>
    /// Create a new appointment
    /// </summary>
    /// <param name="dto">The appointment data</param>
    /// <returns>The created appointment</returns>
    /// <response code="201">Returns the newly created appointment</response>
    /// <response code="400">If the data is invalid</response>
    [HttpPost]
    [ProducesResponseType(typeof(AppointmentResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AppointmentResponseDto>> Create([FromBody] CreateAppointmentDto dto)
    {
        _logger.LogInformation("Creating new appointment for user {UserId}", dto.UserId);

        // Validate userId
        if (dto.UserId == Guid.Empty || dto.UserId == null)
        {
            _logger.LogWarning("Attempted to create appointment without valid userId");
            return BadRequest(new { message = "UserId is required and cannot be empty" });
        }

        var now = DateTime.UtcNow;
        
        // Ensure appointmentDate is in UTC
        var appointmentDateUtc = dto.AppointmentDate.Kind == DateTimeKind.Utc 
            ? dto.AppointmentDate 
            : dto.AppointmentDate.ToUniversalTime();
        
        var appointment = new Appointment
        {
            Id = Guid.NewGuid(),
            UserId = dto.UserId,
            DoctorName = dto.DoctorName,
            Location = dto.Location,
            AppointmentDate = appointmentDateUtc,
            Notes = dto.Notes,
            CreatedAt = now,
            UpdatedAt = now
        };

        _context.Appointments.Add(appointment);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Appointment created successfully with ID {AppointmentId} for user {UserId}", 
            appointment.Id, appointment.UserId);

        // Create initial reminder
        await CreateAppointmentReminder(appointment);

        var response = AppointmentResponseDto.FromEntity(appointment);
        return CreatedAtAction(nameof(GetById), new { id = appointment.Id }, response);
    }

    private async Task CreateAppointmentReminder(Appointment appointment)
    {
        try 
        {
            var httpClient = _httpClientFactory.CreateClient();
            
            // Reminder at the same time as appointment (not 1 hour before)
            var reminderTime = appointment.AppointmentDate;
            
            var reminderDto = new
            {
                userId = appointment.UserId,
                type = 1, // 1 = Appointment
                referenceId = appointment.Id,
                scheduledTime = reminderTime
            };

            var response = await httpClient.PostAsJsonAsync("http://localhost:5005/api/reminders", reminderDto);
            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                _logger.LogError("Failed to create appointment reminder: {Status}, {Error}", response.StatusCode, error);
            }
            else
            {
                _logger.LogInformation("Created appointment reminder for {AppointmentId} at {ReminderTime} (same time as appointment {AppointmentDate})", 
                    appointment.Id, reminderTime, appointment.AppointmentDate);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error synchronizing reminder for appointment {AppointmentId}", appointment.Id);
        }
    }

    private async Task<ReminderReferenceDto?> FindAppointmentReminderAsync(Guid appointmentId)
    {
        try
        {
            var httpClient = _httpClientFactory.CreateClient();
            var reminders = await httpClient.GetFromJsonAsync<List<ReminderReferenceDto>>("http://localhost:5005/api/reminders");
            return reminders?.FirstOrDefault(r => r.Type == 1 && r.ReferenceId == appointmentId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error finding appointment reminder for appointment {AppointmentId}", appointmentId);
            return null;
        }
    }

    private async Task SyncAppointmentReminderAsync(Appointment appointment)
    {
        var reminder = await FindAppointmentReminderAsync(appointment.Id);
        try
        {
            var httpClient = _httpClientFactory.CreateClient();
            
            // Reminder at the same time as appointment (not 1 hour before)
            var reminderTime = appointment.AppointmentDate;
            
            var reminderDto = new
            {
                userId = appointment.UserId,
                type = 1,
                referenceId = appointment.Id,
                scheduledTime = reminderTime
            };

            if (reminder == null)
            {
                await httpClient.PostAsJsonAsync("http://localhost:5005/api/reminders", reminderDto);
                _logger.LogInformation("Created appointment reminder during sync for {AppointmentId} at {ReminderTime}", 
                    appointment.Id, reminderTime);
            }
            else
            {
                await httpClient.PutAsJsonAsync($"http://localhost:5005/api/reminders/{reminder.Id}", reminderDto);
                _logger.LogInformation("Updated appointment reminder {ReminderId} to {ReminderTime}", 
                    reminder.Id, reminderTime);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error syncing appointment reminder for appointment {AppointmentId}", appointment.Id);
        }
    }

    private async Task DeleteAppointmentReminderAsync(Guid appointmentId)
    {
        var reminder = await FindAppointmentReminderAsync(appointmentId);
        if (reminder == null) return;

        try
        {
            var httpClient = _httpClientFactory.CreateClient();
            await httpClient.DeleteAsync($"http://localhost:5005/api/reminders/{reminder.Id}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting appointment reminder for appointment {AppointmentId}", appointmentId);
        }
    }

    /// <summary>
    /// Update an existing appointment
    /// </summary>
    /// <param name="id">The appointment ID</param>
    /// <param name="dto">The updated appointment data</param>
    /// <returns>The updated appointment</returns>
    /// <response code="200">Returns the updated appointment</response>
    /// <response code="404">If the appointment is not found</response>
    /// <response code="400">If the data is invalid</response>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(AppointmentResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AppointmentResponseDto>> Update(Guid id, [FromBody] UpdateAppointmentDto dto)
    {
        _logger.LogInformation("Updating appointment with ID: {AppointmentId}", id);

        var appointment = await _context.Appointments.FindAsync(id);
        if (appointment == null)
        {
            _logger.LogWarning("Appointment with ID {AppointmentId} not found", id);
            return NotFound(new { message = $"Appointment with ID {id} not found" });
        }

        // Update only provided fields (partial update support)
        if (dto.DoctorName != null)
            appointment.DoctorName = dto.DoctorName;
        
        if (dto.Location != null)
            appointment.Location = dto.Location;
        
        if (dto.AppointmentDate.HasValue)
            appointment.AppointmentDate = dto.AppointmentDate.Value;
        
        if (dto.Notes != null)
            appointment.Notes = dto.Notes;

        appointment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await SyncAppointmentReminderAsync(appointment);

        var response = AppointmentResponseDto.FromEntity(appointment);
        return Ok(response);
    }

    /// <summary>
    /// Delete an appointment
    /// </summary>
    /// <param name="id">The appointment ID</param>
    /// <returns>No content</returns>
    /// <response code="204">If the appointment was successfully deleted</response>
    /// <response code="404">If the appointment is not found</response>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id)
    {
        _logger.LogInformation("Deleting appointment with ID: {AppointmentId}", id);

        var appointment = await _context.Appointments.FindAsync(id);
        if (appointment == null)
        {
            _logger.LogWarning("Appointment with ID {AppointmentId} not found", id);
            return NotFound(new { message = $"Appointment with ID {id} not found" });
        }

        _context.Appointments.Remove(appointment);
        await _context.SaveChangesAsync();
        await DeleteAppointmentReminderAsync(id);

        _logger.LogInformation("Appointment with ID {AppointmentId} deleted successfully", id);

        return NoContent();
    }

    /// <summary>
    /// Import appointments from Excel file
    /// </summary>
    /// <param name="userId">User ID to import appointments for</param>
    /// <param name="file">Excel file containing appointment data</param>
    /// <returns>Import result</returns>
    /// <response code="200">Returns import result with count and any errors</response>
    /// <response code="400">If the file is invalid or missing</response>
    [HttpPost("import/{userId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ImportFromExcel(Guid userId, [FromForm] IFormFile file)
    {
        _logger.LogInformation("Importing appointments from Excel for user {UserId}", userId);

        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Không có file được tải lên" });

        if (!file.FileName.EndsWith(".xlsx") && !file.FileName.EndsWith(".xls"))
            return BadRequest(new { message = "File phải là định dạng Excel (.xlsx hoặc .xls)" });

        try
        {
            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

            var importedCount = 0;
            var errors = new List<string>();

            using var stream = new MemoryStream();
            await file.CopyToAsync(stream);

            using var package = new ExcelPackage(stream);
            var worksheet = package.Workbook.Worksheets.FirstOrDefault();
            if (worksheet == null)
                return BadRequest(new { message = "File Excel phải có ít nhất một sheet" });

            var rowCount = worksheet.Dimension?.Rows ?? 0;
            if (rowCount < 2)
                return BadRequest(new { message = "File Excel phải có dòng tiêu đề và ít nhất một dòng dữ liệu" });

            // Expected columns: Doctor Name | Location | Appointment Date | Notes
            for (int row = 2; row <= rowCount; row++)
            {
                try
                {
                    var doctorName = worksheet.Cells[row, 1].Value?.ToString()?.Trim();
                    var location   = worksheet.Cells[row, 2].Value?.ToString()?.Trim();
                    var dateCell   = worksheet.Cells[row, 3].Value;
                    var notes      = worksheet.Cells[row, 4].Value?.ToString()?.Trim();

                    if (string.IsNullOrEmpty(doctorName))
                    {
                        errors.Add($"Dòng {row}: Tên bác sĩ không được để trống");
                        continue;
                    }

                    // Handle both Excel OADate (double) and string date formats
                    DateTime appointmentDate;
                    if (dateCell is double oaDate)
                    {
                        appointmentDate = DateTime.FromOADate(oaDate);
                    }
                    else
                    {
                        var dateStr = dateCell?.ToString()?.Trim();
                        if (!DateTime.TryParse(dateStr, out appointmentDate))
                        {
                            errors.Add($"Dòng {row}: Ngày giờ khám không hợp lệ '{dateStr}'. Dùng định dạng yyyy-MM-dd HH:mm");
                            continue;
                        }
                    }

                    var now = DateTime.UtcNow;
                    var appointment = new Appointment
                    {
                        Id              = Guid.NewGuid(),
                        UserId          = userId,
                        DoctorName      = doctorName,
                        Location        = location,
                        AppointmentDate = appointmentDate.Kind == DateTimeKind.Utc
                                            ? appointmentDate
                                            : appointmentDate.ToUniversalTime(),
                        Notes           = notes,
                        CreatedAt       = now,
                        UpdatedAt       = now
                    };

                    _context.Appointments.Add(appointment);
                    await _context.SaveChangesAsync();

                    await CreateAppointmentReminder(appointment);

                    importedCount++;
                    _logger.LogInformation("Imported appointment: {DoctorName} on {Date} for user {UserId}",
                        doctorName, appointmentDate, userId);
                }
                catch (Exception ex)
                {
                    errors.Add($"Dòng {row}: {ex.Message}");
                    _logger.LogError(ex, "Error importing appointment at row {Row}", row);
                }
            }

            return Ok(new
            {
                message       = $"Hoàn tất. Đã nhập thành công {importedCount} lịch khám.",
                importedCount,
                errors        = errors.Count > 0 ? errors : null
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error importing appointments from Excel");
            return StatusCode(500, new { message = "Lỗi khi nhập dữ liệu lịch khám", detail = ex.Message });
        }
    }
}
