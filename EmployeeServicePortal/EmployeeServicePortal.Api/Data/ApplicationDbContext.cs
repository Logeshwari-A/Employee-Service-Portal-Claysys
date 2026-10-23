
using EmployeeServicePortal.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace EmployeeServicePortal.Api.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<ServiceRequest> ServiceRequests { get; set; }
}
