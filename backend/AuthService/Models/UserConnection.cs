using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuthService.Models;

public class UserConnection
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid CaregiverId { get; set; }

    [Required]
    public Guid ElderlyId { get; set; }

    public DateTime ConnectedAt { get; set; }
}
