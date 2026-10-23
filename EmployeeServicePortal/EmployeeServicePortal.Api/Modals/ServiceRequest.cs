
using System.ComponentModel.DataAnnotations;

namespace EmployeeServicePortal.Api.Models;

public class ServiceRequest
{
    [Key]
    public int RequestID { get; set; }

    public string RequestTitle { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string Category { get; set; } = string.Empty;

    public string? AssetTag { get; set; }

    public string BusinessImpact { get; set; } = string.Empty;

    public string Urgency { get; set; } = string.Empty;

    public string Priority { get; set; } = string.Empty;

    public string Status { get; set; } = "Pending";

    public string RequesterName { get; set; } = string.Empty;

    public DateTime? TargetDate { get; set; }

    public DateTime CreatedAt { get; set; }
}
