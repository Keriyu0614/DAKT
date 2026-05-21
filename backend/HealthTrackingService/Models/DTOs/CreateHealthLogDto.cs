using System.ComponentModel.DataAnnotations;

namespace HealthTrackingService.Models.DTOs;

/// <summary>
/// Data Transfer Object for creating a new health log entry
/// </summary>
public class CreateHealthLogDto
{
    /// <summary>
    /// ID of the user for this health log
    /// </summary>
    [Required]
    public Guid UserId { get; set; }

    /// <summary>
    /// Date of the health measurements
    /// </summary>
    [Required]
    public DateTime Date { get; set; }

    /// <summary>
    /// Blood pressure reading (e.g., "120/80"). Optional — use "-" or omit if not measured.
    /// </summary>
    [StringLength(50)]
    public string? BloodPressure { get; set; }

    /// <summary>
    /// Heart rate in beats per minute (optional)
    /// </summary>
    [Range(30, 300)]
    public int? HeartRate { get; set; }

    /// <summary>
    /// Optional note about health status
    /// </summary>
    [StringLength(1000)]
    public string? Note { get; set; }

    /// <summary>
    /// Weight in kilograms (optional)
    /// </summary>
    [Range(20, 500)]
    public double? Weight { get; set; }

    /// <summary>
    /// Who recorded this log: "self" (elderly user) or "caregiver" (default)
    /// </summary>
    [StringLength(20)]
    public string RecordedBy { get; set; } = "caregiver";

    /// <summary>
    /// Systolic blood pressure component (optional)
    /// </summary>
    [Range(60, 250)]
    public int? Systolic { get; set; }

    /// <summary>
    /// Diastolic blood pressure component (optional)
    /// </summary>
    [Range(40, 150)]
    public int? Diastolic { get; set; }
}

