
using EmployeeServicePortal.Api.Data;
using EmployeeServicePortal.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EmployeeServicePortal.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ServiceRequestsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ServiceRequestsController(ApplicationDbContext context)
    {
        _context = context;
    }
    
    //EF core direct
    // // GET: api/ServiceRequests
    // [HttpGet]
    // public async Task<ActionResult<IEnumerable<ServiceRequest>>> GetRequests()
    // {
    //     var requests = await _context.ServiceRequests
    //         .OrderByDescending(r => r.CreatedAt)
    //         .ToListAsync();

    //     return Ok(requests);
    // }


    //SP Method
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ServiceRequest>>> GetRequests()
    {
        var requests = await _context.ServiceRequests
            .FromSqlRaw("EXEC dbo.sp_GetAllServiceRequests")
            .ToListAsync();

        return Ok(requests);
    }
    
    //EF core direct
    // // POST: api/ServiceRequests
    // [HttpPost]
    // public async Task<ActionResult<ServiceRequest>> CreateRequest(
    //     ServiceRequest request)
    // {
    //     if (string.IsNullOrWhiteSpace(request.RequestTitle) ||
    //         string.IsNullOrWhiteSpace(request.Description) ||
    //         string.IsNullOrWhiteSpace(request.Category))
    //     {
    //         return BadRequest("Title, description, and category are required.");
    //     }

    //     if (request.Description.Length > 1000)
    //     {
    //         return BadRequest("Description cannot exceed 1000 characters.");
    //     }

    //     if (!new[] { "LOW", "NORMAL", "HIGH" }
    //         .Contains(request.Priority?.ToUpperInvariant()))
    //     {
    //         return BadRequest("Priority must be LOW, NORMAL, or HIGH.");
    //     }

    //     if (request.TargetDate.HasValue &&
    //         request.TargetDate.Value.Date < DateTime.Today)
    //     {
    //         return BadRequest("Target date cannot be in the past.");
    //     }

    //     request.RequestID = 0;
    //     request.Priority = request.Priority!.ToUpperInvariant();
    //     request.Status = "PENDING APPROVAL";
    //     request.CreatedAt = DateTime.Now;
    //     request.RequesterName = string.IsNullOrWhiteSpace(request.RequesterName)
    //         ? "Logeshwari"
    //         : request.RequesterName;

    //     _context.ServiceRequests.Add(request);
    //     await _context.SaveChangesAsync();

    //     return Ok(request);
    // }

    //SP Method create row
    // POST: api/ServiceRequests
    [HttpPost]
    public async Task<ActionResult<ServiceRequest>> CreateRequest(
        ServiceRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.RequestTitle) ||
            string.IsNullOrWhiteSpace(request.Description) ||
            string.IsNullOrWhiteSpace(request.Category))
        {
            return BadRequest("Title, description, and category are required.");
        }

        if (request.Description.Length > 1000)
        {
            return BadRequest("Description cannot exceed 1000 characters.");
        }

        if (!new[] { "LOW", "NORMAL", "HIGH" }
            .Contains(request.Priority?.ToUpperInvariant()))
        {
            return BadRequest("Priority must be LOW, NORMAL, or HIGH.");
        }

        if (request.TargetDate.HasValue &&
            request.TargetDate.Value.Date < DateTime.Today)
        {
            return BadRequest("Target date cannot be in the past.");
        }

        request.Priority = request.Priority!.ToUpperInvariant();

        request.RequesterName = string.IsNullOrWhiteSpace(request.RequesterName)
            ? "Logeshwari"
            : request.RequesterName;

        var parameters = new[]
        {
            new Microsoft.Data.SqlClient.SqlParameter(
                "@RequestTitle",
                System.Data.SqlDbType.NVarChar, 150)
                { Value = request.RequestTitle },

            new Microsoft.Data.SqlClient.SqlParameter(
                "@Description",
                System.Data.SqlDbType.NVarChar, 1000)
                { Value = request.Description },

            new Microsoft.Data.SqlClient.SqlParameter(
                "@Category",
                System.Data.SqlDbType.NVarChar, 100)
                { Value = request.Category },

            new Microsoft.Data.SqlClient.SqlParameter(
                "@AssetTag",
                System.Data.SqlDbType.NVarChar, 50)
                { Value = (object?)request.AssetTag ?? DBNull.Value },

            new Microsoft.Data.SqlClient.SqlParameter(
                "@BusinessImpact",
                System.Data.SqlDbType.NVarChar, 30)
                { Value = request.BusinessImpact },

            new Microsoft.Data.SqlClient.SqlParameter(
                "@Urgency",
                System.Data.SqlDbType.NVarChar, 30)
                { Value = request.Urgency },

            new Microsoft.Data.SqlClient.SqlParameter(
                "@Priority",
                System.Data.SqlDbType.NVarChar, 20)
                { Value = request.Priority },

            new Microsoft.Data.SqlClient.SqlParameter(
                "@RequesterName",
                System.Data.SqlDbType.NVarChar, 100)
                { Value = request.RequesterName },

            new Microsoft.Data.SqlClient.SqlParameter(
                "@TargetDate",
                System.Data.SqlDbType.Date)
                { Value = (object?)request.TargetDate?.Date ?? DBNull.Value }
        };

        var savedRequests = await _context.ServiceRequests
            .FromSqlRaw(
                "EXEC dbo.sp_CreateServiceRequest " +
                "@RequestTitle, @Description, @Category, @AssetTag, " +
                "@BusinessImpact, @Urgency, @Priority, @RequesterName, @TargetDate",
                parameters)
            .AsNoTracking()
            .ToListAsync();

        var savedRequest = savedRequests.Single();

        return Ok(savedRequest);
    }

    // // POST: api/ServiceRequests/draft
    // [HttpPost("draft")]
    // public async Task<ActionResult<ServiceRequest>> SaveDraft(
    //     ServiceRequest request)
    // {
    //     request.RequestID = 0;
    //     request.Status = "DRAFT";
    //     request.Priority = string.IsNullOrWhiteSpace(request.Priority)
    //         ? "LOW"
    //         : request.Priority.ToUpperInvariant();
    //     request.CreatedAt = DateTime.Now;

    //     // Required SQL columns must contain values, even for incomplete drafts.
    //     request.RequestTitle ??= "";
    //     request.Description ??= "";
    //     request.Category ??= "";
    //     request.BusinessImpact ??= "";
    //     request.Urgency ??= "";
    //     request.RequesterName = string.IsNullOrWhiteSpace(request.RequesterName)
    //         ? "Logeshwari"
    //         : request.RequesterName;

    //     _context.ServiceRequests.Add(request);
    //     await _context.SaveChangesAsync();

    //     return Ok(request);
    // }

    //SP Method draft
    
    [HttpPost("draft")]
    public async Task<ActionResult<ServiceRequest>> SaveDraft(
        ServiceRequest request)
    {
    request.RequestID = 0;

    request.Priority = string.IsNullOrWhiteSpace(request.Priority)
        ? "LOW"
        : request.Priority.ToUpperInvariant();

    request.RequesterName = string.IsNullOrWhiteSpace(request.RequesterName)
        ? "Logeshwari"
        : request.RequesterName;

    request.RequestTitle ??= "";
    request.Description ??= "";
    request.Category ??= "";
    request.BusinessImpact ??= "";
    request.Urgency ??= "";

    var parameters = new[]
    {
        new Microsoft.Data.SqlClient.SqlParameter(
            "@RequestTitle",
            System.Data.SqlDbType.NVarChar, 150)
            { Value = request.RequestTitle },

        new Microsoft.Data.SqlClient.SqlParameter(
            "@Description",
            System.Data.SqlDbType.NVarChar, 1000)
            { Value = request.Description },

        new Microsoft.Data.SqlClient.SqlParameter(
            "@Category",
            System.Data.SqlDbType.NVarChar, 100)
            { Value = request.Category },

        new Microsoft.Data.SqlClient.SqlParameter(
            "@AssetTag",
            System.Data.SqlDbType.NVarChar, 50)
            { Value = (object?)request.AssetTag ?? DBNull.Value },

        new Microsoft.Data.SqlClient.SqlParameter(
            "@BusinessImpact",
            System.Data.SqlDbType.NVarChar, 30)
            { Value = request.BusinessImpact },

        new Microsoft.Data.SqlClient.SqlParameter(
            "@Urgency",
            System.Data.SqlDbType.NVarChar, 30)
            { Value = request.Urgency },

        new Microsoft.Data.SqlClient.SqlParameter(
            "@Priority",
            System.Data.SqlDbType.NVarChar, 20)
            { Value = request.Priority },

        new Microsoft.Data.SqlClient.SqlParameter(
            "@RequesterName",
            System.Data.SqlDbType.NVarChar, 100)
            { Value = request.RequesterName },

        new Microsoft.Data.SqlClient.SqlParameter(
            "@TargetDate",
            System.Data.SqlDbType.Date)
            { Value = (object?)request.TargetDate?.Date ?? DBNull.Value }
    };

        var savedRequests = await _context.ServiceRequests
          .FromSqlRaw(
             "EXEC dbo.sp_SaveServiceRequestDraft " +
             "@RequestTitle, @Description, @Category, @AssetTag, " +
             "@BusinessImpact, @Urgency, @Priority, @RequesterName, @TargetDate",
             parameters)
         .AsNoTracking()
         .ToListAsync();
 
        var savedRequest = savedRequests.Single();

        return Ok(savedRequest);
    }


    // // PUT: api/ServiceRequests/5/approve
    // [HttpPut("{id:int}/approve")]
    // public async Task<IActionResult> ApproveRequest(int id)
    // {
    //     var request = await _context.ServiceRequests.FindAsync(id);

    //     if (request == null)
    //         return NotFound("Request not found.");

    //     if (request.Status != "PENDING APPROVAL" &&
    //         request.Status != "Pending")
    //         return BadRequest("Only pending requests can be approved.");

    //     request.Status = "APPROVED";
    //     await _context.SaveChangesAsync();

    //     return Ok(request);
    // }

    //SP Method approve
    
    [HttpPut("{id:int}/approve")]
    public async Task<IActionResult> ApproveRequest(int id)
    {
        var parameter = new Microsoft.Data.SqlClient.SqlParameter(
            "@RequestID",
            System.Data.SqlDbType.Int)
        {
            Value = id
        };

        try
        {
            var updatedRequests = await _context.ServiceRequests
                .FromSqlRaw(
                    "EXEC dbo.sp_ApproveServiceRequest @RequestID",
                    parameter)
                .AsNoTracking()
                .ToListAsync();

            var updatedRequest = updatedRequests.Single();

            return Ok(updatedRequest);
        }
        catch (Microsoft.Data.SqlClient.SqlException ex)
            when (ex.Number == 50000)
        {
            return BadRequest(
                "Request not found or cannot be approved.");
        }
    }


//     // PUT: api/ServiceRequests/5/reject
//     [HttpPut("{id:int}/reject")]
//     public async Task<IActionResult> RejectRequest(int id)
//     {
//         var request = await _context.ServiceRequests.FindAsync(id);

//         if (request == null)
//             return NotFound("Request not found.");

//         if (request.Status != "PENDING APPROVAL" &&
//             request.Status != "Pending")
//             return BadRequest("Only pending requests can be rejected.");

//         request.Status = "REJECTED";
//         await _context.SaveChangesAsync();

//         return Ok(request);
//     }
// }

    //SP Method reject

    [HttpPut("{id:int}/reject")]
    public async Task<IActionResult> RejectRequest(int id)
    {
        var parameter = new Microsoft.Data.SqlClient.SqlParameter(
            "@RequestID",
            System.Data.SqlDbType.Int)
        {
            Value = id
        };

        try
        {
            var updatedRequests = await _context.ServiceRequests
                .FromSqlRaw(
                    "EXEC dbo.sp_RejectServiceRequest @RequestID",
                    parameter)
                .AsNoTracking()
                .ToListAsync();

            var updatedRequest = updatedRequests.Single();

            return Ok(updatedRequest);
        }
        catch (Microsoft.Data.SqlClient.SqlException ex)
            when (ex.Number == 50000)
        {
            return BadRequest(
                "Request not found or cannot be rejected.");
        }
    }
}