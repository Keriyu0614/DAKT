using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace MedicationService.Models.DTOs;

/// <summary>
/// Data Transfer Object for creating a new medication schedule
/// </summary>
public class CreateMedicationDto
{
    /// <summary>
    /// ID of the user who will take this medication
    /// </summary>
    [Required]
    [JsonPropertyName("userId")]
    public Guid UserId { get; set; }

    /// <summary>
    /// Name of the medication
    /// </summary>
    [Required]
    [StringLength(200, MinimumLength = 1)]
    [JsonPropertyName("medicationName")]
    public string MedicationName { get; set; } = string.Empty;

    /// <summary>
    /// Dosage information
    /// </summary>
    [Required]
    [StringLength(100, MinimumLength = 1)]
    [JsonPropertyName("dosage")]
    public string Dosage { get; set; } = string.Empty;

    /// <summary>
    /// Frequency description
    /// </summary>
    [Required]
    [StringLength(200, MinimumLength = 1)]
    [JsonPropertyName("frequency")]
    public string Frequency { get; set; } = string.Empty;

    /// <summary>
    /// Scheduled times (e.g., "08:00, 20:00")
    /// </summary>
    [Required]
    [StringLength(500, MinimumLength = 1)]
    [JsonPropertyName("scheduledTimes")]
    public string ScheduledTimes { get; set; } = string.Empty;

    /// <summary>
    /// Optional instructions for taking the medication
    /// </summary>
    [StringLength(1000)]
    [JsonPropertyName("instructions")]
    public string? Instructions { get; set; }

    /// <summary>
    /// Start date for the medication schedule
    /// </summary>
    [Required]
    [JsonPropertyName("startDate")]
    public DateTime StartDate { get; set; }

    /// <summary>
    /// Optional end date for the medication schedule
    /// </summary>
    [JsonPropertyName("endDate")]
    public DateTime? EndDate { get; set; }
}
