using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MedicationService.Data;
using MedicationService.Models;
using MedicationService.Models.DTOs;
using OfficeOpenXml;

namespace MedicationService.Controllers;

/// <summary>
/// RESTful API controller for managing medication schedules.
/// This is a minimal implementation with in-memory storage for demonstration purposes.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class MedicationsController : ControllerBase
{
    private readonly MedicationDbContext _context;
    private readonly ILogger<MedicationsController> _logger;
    private readonly IHttpClientFactory _httpClientFactory;

    public MedicationsController(MedicationDbContext context, ILogger<MedicationsController> logger, IHttpClientFactory httpClientFactory)
    {
        _context = context;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
    }

    /// <summary>
    /// Get all medication schedules
    /// </summary>
    /// <returns>List of all medications</returns>
    /// <response code="200">Returns the list of medications</response>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<MedicationResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<MedicationResponseDto>>> GetAll([FromQuery] Guid? userId)
    {
        _logger.LogInformation("Retrieving medications. UserId filter: {UserId}", userId);
        
        IQueryable<Medication> query = _context.Medications;
        
        if (userId.HasValue)
        {
            query = query.Where(m => m.UserId == userId.Value);
        }

        var medications = await query.ToListAsync();
        var response = medications.Select(MedicationResponseDto.FromEntity);
        return Ok(response);
    }

    /// <summary>
    /// Get a specific medication by ID
    /// </summary>
    /// <param name="id">The medication ID</param>
    /// <returns>The medication if found</returns>
    /// <response code="200">Returns the medication</response>
    /// <response code="404">If the medication is not found</response>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(MedicationResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MedicationResponseDto>> GetById(Guid id)
    {
        _logger.LogInformation("Retrieving medication with ID: {MedicationId}", id);
        
        var medication = await _context.Medications.FindAsync(id);
        if (medication == null)
        {
            _logger.LogWarning("Medication with ID {MedicationId} not found", id);
            return NotFound(new { message = $"Medication with ID {id} not found" });
        }

        return Ok(MedicationResponseDto.FromEntity(medication));
    }

    /// <summary>
    /// Create a new medication schedule
    /// </summary>
    /// <param name="dto">The medication data</param>
    /// <returns>The created medication</returns>
    /// <response code="201">Returns the newly created medication</response>
    /// <response code="400">If the data is invalid</response>
    [HttpPost]
    [ProducesResponseType(typeof(MedicationResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<MedicationResponseDto>> Create([FromBody] CreateMedicationDto dto)
    {
        _logger.LogInformation("Creating new medication for user {UserId}", dto.UserId);

        var now = DateTime.UtcNow;
        var medication = new Medication
        {
            Id = Guid.NewGuid(),
            UserId = dto.UserId,
            MedicationName = dto.MedicationName,
            Dosage = dto.Dosage,
            Frequency = dto.Frequency,
            ScheduledTimes = dto.ScheduledTimes,
            Instructions = dto.Instructions,
            StartDate = dto.StartDate,
            // If no end date provided, default to same day as StartDate (end of day)
            EndDate = dto.EndDate ?? dto.StartDate,
            CreatedAt = now,
            UpdatedAt = now
        };

        _context.Medications.Add(medication);
        await _context.SaveChangesAsync();

        // Create initial reminders
        await CreateMedicationReminders(medication);

        var response = MedicationResponseDto.FromEntity(medication);
        return CreatedAtAction(nameof(GetById), new { id = medication.Id }, response);
    }

    private async Task CreateMedicationReminders(Medication medication)
    {
        try 
        {
            var httpClient = _httpClientFactory.CreateClient();
            var times = (medication.ScheduledTimes ?? "").Split(',', StringSplitOptions.RemoveEmptyEntries);
            
            // Vietnam timezone (GMT+7)
            var vietnamTimeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
            var nowVietnam = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, vietnamTimeZone);
            var todayVietnam = nowVietnam.Date;

            // Start from the medication's StartDate (not today) to respect the scheduled start
            var startDay = medication.StartDate.Date > todayVietnam
                ? medication.StartDate.Date
                : todayVietnam;

            _logger.LogInformation("Creating reminders for medication {MedicationId}. Current Vietnam time: {VietnamTime}, StartDay: {StartDay}", 
                medication.Id, nowVietnam, startDay);
            
            foreach (var timeStr in times)
            {
                if (TimeSpan.TryParse(timeStr.Trim(), out var time))
                {
                    // Create reminders for the next 7 days starting from startDay
                    for (int dayOffset = 0; dayOffset < 7; dayOffset++)
                    {
                        var targetDate = startDay.AddDays(dayOffset);

                        // Do not create reminders past the medication's end date
                        if (medication.EndDate.HasValue && targetDate > medication.EndDate.Value.Date)
                        {
                            break;
                        }

                        var scheduledDateTimeVietnam = targetDate.Add(time);
                        
                        // Skip if this time has already passed (only relevant when startDay == today)
                        if (targetDate == todayVietnam && scheduledDateTimeVietnam <= nowVietnam)
                        {
                            continue;
                        }
                        
                        // Convert Vietnam time to UTC for storage
                        var scheduledDateTimeUtc = TimeZoneInfo.ConvertTimeToUtc(scheduledDateTimeVietnam, vietnamTimeZone);
                        
                        var reminderDto = new
                        {
                            userId = medication.UserId,
                            type = 0, // 0 = Medication
                            referenceId = medication.Id,
                            scheduledTime = scheduledDateTimeUtc
                        };

                        _logger.LogInformation("Creating reminder for day +{DayOffset}: Vietnam time {VietnamTime} → UTC {UtcTime}", 
                            dayOffset, scheduledDateTimeVietnam, scheduledDateTimeUtc);

                        var response = await httpClient.PostAsJsonAsync("http://localhost:5005/api/reminders", reminderDto);
                        if (!response.IsSuccessStatusCode)
                        {
                            var error = await response.Content.ReadAsStringAsync();
                            _logger.LogError("Failed to create reminder: {Status}, {Error}", response.StatusCode, error);
                        }
                        else
                        {
                            _logger.LogInformation("Successfully created reminder for medication {MedicationId} at {VietnamTime} (Vietnam time)", 
                                medication.Id, scheduledDateTimeVietnam);
                        }
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error synchronizing reminders for medication {MedicationId}", medication.Id);
        }
    }

    /// <summary>
    /// Update an existing medication schedule
    /// </summary>
    /// <param name="id">The medication ID</param>
    /// <param name="dto">The updated medication data</param>
    /// <returns>The updated medication</returns>
    /// <response code="200">Returns the updated medication</response>
    /// <response code="404">If the medication is not found</response>
    /// <response code="400">If the data is invalid</response>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(MedicationResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<MedicationResponseDto>> Update(Guid id, [FromBody] UpdateMedicationDto dto)
    {
        _logger.LogInformation("Updating medication with ID: {MedicationId}", id);

        var medication = await _context.Medications.FindAsync(id);
        if (medication == null)
        {
            _logger.LogWarning("Medication with ID {MedicationId} not found", id);
            return NotFound(new { message = $"Medication with ID {id} not found" });
        }

        // Update only provided fields (partial update support)
        if (dto.MedicationName != null)
            medication.MedicationName = dto.MedicationName;
        
        if (dto.Dosage != null)
            medication.Dosage = dto.Dosage;
        
        if (dto.Frequency != null)
            medication.Frequency = dto.Frequency;
        
        if (dto.ScheduledTimes != null)
            medication.ScheduledTimes = dto.ScheduledTimes;
        
        if (dto.Instructions != null)
            medication.Instructions = dto.Instructions;
        
        if (dto.StartDate.HasValue)
            medication.StartDate = dto.StartDate.Value;
        
        if (dto.EndDate.HasValue)
            medication.EndDate = dto.EndDate;

        medication.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var response = MedicationResponseDto.FromEntity(medication);
        return Ok(response);
    }

    /// <summary>
    /// Delete a medication schedule
    /// </summary>
    /// <param name="id">The medication ID</param>
    /// <returns>No content</returns>
    /// <response code="204">If the medication was successfully deleted</response>
    /// <response code="404">If the medication is not found</response>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id)
    {
        _logger.LogInformation("Deleting medication with ID: {MedicationId}", id);

        var medication = await _context.Medications.FindAsync(id);
        if (medication == null)
        {
            _logger.LogWarning("Medication with ID {MedicationId} not found", id);
            return NotFound(new { message = $"Medication with ID {id} not found" });
        }

        _context.Medications.Remove(medication);
        await _context.SaveChangesAsync();
        
        _logger.LogInformation("Medication with ID {MedicationId} deleted successfully", id);

        return NoContent();
    }

    /// <summary>
    /// Debug endpoint to recreate reminders for existing medications
    /// </summary>
    /// <param name="userId">User ID to recreate reminders for</param>
    /// <returns>Success message</returns>
    [HttpPost("recreate-reminders/{userId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> RecreateReminders(Guid userId)
    {
        _logger.LogInformation("Recreating reminders for user {UserId}", userId);

        var medications = await _context.Medications
            .Where(m => m.UserId == userId)
            .ToListAsync();

        foreach (var medication in medications)
        {
            await CreateMedicationReminders(medication);
        }

        return Ok(new { message = $"Recreated reminders for {medications.Count} medications" });
    }

    /// <summary>
    /// Import medications from Excel file
    /// </summary>
    /// <param name="userId">User ID to import medications for</param>
    /// <param name="file">Excel file containing medication data</param>
    /// <returns>Import result</returns>
    /// <response code="200">Returns import result</response>
    /// <response code="400">If the file is invalid</response>
    [HttpPost("import/{userId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ImportFromExcel(Guid userId, IFormFile file)
    {
        _logger.LogInformation("Importing medications from Excel for user {UserId}", userId);

        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "No file uploaded" });
        }

        if (!file.FileName.EndsWith(".xlsx") && !file.FileName.EndsWith(".xls"))
        {
            return BadRequest(new { message = "File must be an Excel file (.xlsx or .xls)" });
        }

        try
        {
            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
            
            var importedCount = 0;
            var errors = new List<string>();

            using (var stream = new MemoryStream())
            {
                await file.CopyToAsync(stream);
                using (var package = new ExcelPackage(stream))
                {
                    var worksheet = package.Workbook.Worksheets.FirstOrDefault();
                    if (worksheet == null)
                    {
                        return BadRequest(new { message = "Excel file must contain at least one worksheet" });
                    }

                    var rowCount = worksheet.Dimension?.Rows ?? 0;
                    if (rowCount < 2) // Header + at least 1 data row
                    {
                        return BadRequest(new { message = "Excel file must contain header row and at least one data row" });
                    }

                    // Expected columns: Name, Dosage Amount, Dosage Unit, Times Per Day, Scheduled Times, Instructions, Start Date, End Date
                    for (int row = 2; row <= rowCount; row++)
                    {
                        try
                        {
                            var name = worksheet.Cells[row, 1].Value?.ToString()?.Trim();
                            var dosageAmountStr = worksheet.Cells[row, 2].Value?.ToString()?.Trim();
                            var dosageUnit = worksheet.Cells[row, 3].Value?.ToString()?.Trim();
                            var timesPerDayStr = worksheet.Cells[row, 4].Value?.ToString()?.Trim();
                            var scheduledTimes = worksheet.Cells[row, 5].Value?.ToString()?.Trim();
                            var instructions = worksheet.Cells[row, 6].Value?.ToString()?.Trim();
                            var startDateCell = worksheet.Cells[row, 7].Value;
                            var endDateCell = worksheet.Cells[row, 8].Value;

                            // Validate required fields
                            if (string.IsNullOrEmpty(name))
                            {
                                errors.Add($"Row {row}: Medication name is required");
                                continue;
                            }

                            if (!decimal.TryParse(dosageAmountStr, out var dosageAmount))
                            {
                                errors.Add($"Row {row}: Invalid dosage amount '{dosageAmountStr}'");
                                continue;
                            }

                            if (string.IsNullOrEmpty(dosageUnit))
                            {
                                errors.Add($"Row {row}: Dosage unit is required");
                                continue;
                            }

                            if (!int.TryParse(timesPerDayStr, out var timesPerDay) || timesPerDay < 1)
                            {
                                errors.Add($"Row {row}: Invalid times per day '{timesPerDayStr}'");
                                continue;
                            }

                            // Handle both Excel OADate (double) and string date formats
                            DateTime startDate;
                            if (startDateCell is double oaStartDate)
                            {
                                startDate = DateTime.FromOADate(oaStartDate);
                            }
                            else
                            {
                                var startDateStr = startDateCell?.ToString()?.Trim();
                                if (!DateTime.TryParse(startDateStr, out startDate))
                                {
                                    errors.Add($"Row {row}: Invalid start date '{startDateStr}'");
                                    continue;
                                }
                            }

                            DateTime? endDate = null;
                            if (endDateCell != null)
                            {
                                if (endDateCell is double oaEndDate)
                                {
                                    endDate = DateTime.FromOADate(oaEndDate);
                                }
                                else
                                {
                                    var endDateStr = endDateCell.ToString()?.Trim();
                                    if (!string.IsNullOrEmpty(endDateStr))
                                    {
                                        if (!DateTime.TryParse(endDateStr, out var parsedEndDate))
                                        {
                                            errors.Add($"Row {row}: Invalid end date '{endDateStr}'");
                                            continue;
                                        }
                                        endDate = parsedEndDate;
                                    }
                                }
                            }

                            // Create medication
                            var now = DateTime.UtcNow;
                            var defaultTimes = string.IsNullOrEmpty(scheduledTimes)
                                ? string.Join(",", GenerateDefaultTimes(timesPerDay))
                                : scheduledTimes;

                            var medication = new Medication
                            {
                                Id = Guid.NewGuid(),
                                UserId = userId,
                                MedicationName = name,
                                Dosage = $"{dosageAmount} {dosageUnit}",
                                Frequency = $"{timesPerDay}x/day",
                                ScheduledTimes = defaultTimes,
                                Instructions = instructions,
                                StartDate = startDate,
                                // If no end date provided, default to same day as StartDate (end of day)
                                EndDate = endDate ?? startDate,
                                CreatedAt = now,
                                UpdatedAt = now
                            };

                            _context.Medications.Add(medication);
                            await _context.SaveChangesAsync();

                            // Create reminders
                            await CreateMedicationReminders(medication);

                            importedCount++;
                            _logger.LogInformation("Imported medication: {Name} for user {UserId}", name, userId);
                        }
                        catch (Exception ex)
                        {
                            errors.Add($"Row {row}: {ex.Message}");
                            _logger.LogError(ex, "Error importing medication at row {Row}", row);
                        }
                    }
                }
            }

            return Ok(new 
            { 
                message = $"Quá trình nhập dữ liệu hoàn tất.",
                importedCount,
                errors = errors.Count > 0 ? errors : null
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error importing medications from Excel");
            return StatusCode(500, new { message = "Error importing medications", detail = ex.Message });
        }
    }

    private string[] GenerateDefaultTimes(int timesPerDay)
    {
        return timesPerDay switch
        {
            1 => new[] { "08:00" },
            2 => new[] { "08:00", "20:00" },
            3 => new[] { "08:00", "14:00", "20:00" },
            4 => new[] { "08:00", "12:00", "16:00", "20:00" },
            _ => Enumerable.Range(0, timesPerDay)
                .Select(i => TimeSpan.FromHours(8 + (12.0 / timesPerDay) * i).ToString(@"hh\:mm"))
                .ToArray()
        };
    }
}
