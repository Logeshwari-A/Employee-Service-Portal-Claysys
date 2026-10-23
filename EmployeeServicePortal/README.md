# Employee Service Portal

Employee Service Portal is a browser-based service request application. Employees can create service requests, save incomplete requests as drafts, review their requests, and submit requests for approval. Approvers can view the approval queue and approve or reject pending requests.

The project consists of:

- A static HTML, CSS, and JavaScript frontend.
- An ASP.NET Core Web API targeting .NET 10.
- SQL Server persistence through Entity Framework Core and stored procedures.

## Features

- Create service requests for hardware, software, and access-related needs.
- Capture description, asset tag, business impact, urgency, priority, requester, and target date.
- Save incomplete requests as drafts.
- View submitted requests and request statuses.
- Approve or reject requests from the approval queue.
- View summary/report screens in the frontend.

## Project structure

```text
EmployeeServicePortal/
├── index.html                         # Frontend entry point
├── css/
│   └── style.css                      # Frontend styles
├── js/
│   └── app.js                         # Frontend behavior and API calls
└── EmployeeServicePortal.Api/
    ├── Controllers/
    │   └── ServiceRequestsController.cs
    ├── Data/
    │   └── ApplicationDbContext.cs
    ├── Models/
    │   └── ServiceRequest.cs
    ├── Program.cs
    ├── appsettings.json
    └── EmployeeServicePortal.Api.csproj
```

## Prerequisites

- .NET 10 SDK
- SQL Server running locally or on a reachable server
- A browser
- A static file server for the frontend, such as VS Code Live Server or Python's built-in HTTP server

## Database setup

The API uses the `DefaultConnection` connection string in `EmployeeServicePortal.Api/appsettings.json`:

```text
Server=localhost;Database=EmployeeServiceDB;Integrated Security=True;Encrypt=True;TrustServerCertificate=True;
```

Update this value for your SQL Server instance if necessary. On startup, the API calls `EnsureCreated()` to create the database schema when it does not exist.

The API also calls these stored procedures, which must be created in the `EmployeeServiceDB` database:

- `dbo.sp_GetAllServiceRequests`
- `dbo.sp_CreateServiceRequest`
- `dbo.sp_SaveServiceRequestDraft`
- `dbo.sp_ApproveServiceRequest`
- `dbo.sp_RejectServiceRequest`

Stored procedure scripts are not included in this repository, so provision them separately before using the API.

## Running the application

### 1. Start the API

From the project root:

```powershell
cd EmployeeServicePortal\EmployeeServicePortal.Api
dotnet restore
dotnet run --urls http://localhost:5000
```

The `--urls` option matches the API URL currently configured in `js/app.js`. The API will be available at:

```text
http://localhost:5000
```

Alternatively, start the API with the checked-in launch profile:

```powershell
dotnet run
```

That profile uses `http://localhost:5163`. If you use it, change the `API_URL` constant at the top of `js/app.js` to:

```javascript
const API_URL = "http://localhost:5163/api/ServiceRequests";
```

### 2. Serve the frontend

From the `EmployeeServicePortal` directory, use a static file server. For example:

```powershell
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

The API enables CORS for the frontend during development.

## API endpoints

All endpoints are relative to `/api/ServiceRequests`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/ServiceRequests` | List all service requests |
| `POST` | `/api/ServiceRequests` | Create and submit a service request |
| `POST` | `/api/ServiceRequests/draft` | Save a request as a draft |
| `PUT` | `/api/ServiceRequests/{id}/approve` | Approve a request |
| `PUT` | `/api/ServiceRequests/{id}/reject` | Reject a request |

Example request body:

```json
{
  "requestTitle": "Laptop cannot connect to the network",
  "description": "The laptop loses the office Wi-Fi connection repeatedly.",
  "category": "Hardware",
  "assetTag": "LAP-1001",
  "businessImpact": "team",
  "urgency": "soon",
  "priority": "NORMAL",
  "requesterName": "Employee name",
  "targetDate": "2026-12-01"
}
```

For submitted requests, `requestTitle`, `description`, and `category` are required. Descriptions are limited to 1,000 characters, priority must be `LOW`, `NORMAL`, or `HIGH`, and the target date cannot be in the past.

## Configuration notes

- The frontend API base URL is defined by `API_URL` in `js/app.js`.
- The API uses SQL Server through `Microsoft.EntityFrameworkCore.SqlServer`.
- Development settings are loaded from `appsettings.Development.json`.
- The API currently allows any origin, header, and method through its CORS policy. Restrict this policy before deploying outside a trusted development environment.

## Troubleshooting

- **Unable to load requests:** Confirm that the API is running, SQL Server is reachable, the connection string is correct, and the frontend `API_URL` matches the API port.
- **Stored procedure errors:** Confirm that all five required procedures exist in the `EmployeeServiceDB` database and return columns matching the `ServiceRequest` model.
- **CORS errors:** Serve the frontend through a local HTTP server and verify that the API CORS policy permits the frontend origin.
- **Database connection errors:** Check SQL Server availability and the authentication settings in `appsettings.json`.
