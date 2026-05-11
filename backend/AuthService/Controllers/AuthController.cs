using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AuthService.Data;
using AuthService.Models;
using AuthService.Models.DTOs;
using Google.Apis.Auth;

namespace AuthService.Controllers;

/// <summary>
/// API controller for user authentication and identity management.
/// This is a simplified demo implementation for academic purposes.
/// </summary>
[ApiController]
[Route("api/auth")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private static readonly string DEBUG_HEADER = "X-Auth-Debug";
    private readonly AuthDbContext _context;
    private readonly ILogger<AuthController> _logger;

    public AuthController(AuthDbContext context, ILogger<AuthController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Register a new user
    /// </summary>
    /// <param name="dto">Registration data</param>
    /// <returns>Authentication response with user info and token</returns>
    /// <response code="200">Returns the authenticated user info and token</response>
    /// <response code="400">If the data is invalid or email already exists</response>
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto dto)
    {
        _logger.LogInformation("Register request received for email: {Email}", dto.Email);
        
        try 
        {
            // Validate required fields
            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest(new { message = "Name is required" });
            }

            if (string.IsNullOrWhiteSpace(dto.Email))
            {
                return BadRequest(new { message = "Email is required" });
            }

            if (string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest(new { message = "Password is required" });
            }

            _logger.LogInformation("Processing registration for: {Email}, Name: {Name}, Role: {Role}", 
                dto.Email, dto.Name, dto.Role ?? 0);

            // Check if user already exists
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email.ToLowerInvariant()))
            {
                return BadRequest(new { message = "User already exists" });
            }

            var user = new User
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                Email = dto.Email.ToLowerInvariant(),
                Password = dto.Password,
                Role = (UserRole)(dto.Role ?? 0),
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var token = GeneratePlaceholderToken(user);
            var response = AuthResponseDto.FromUser(user, token);
            
            _logger.LogInformation("User registered successfully: {UserId}", user.Id);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Registration error");
            return StatusCode(500, new { message = "An error occurred during registration", detail = ex.Message });
        }
    }

    /// <summary>
    /// Login with email and password
    /// </summary>
    /// <param name="dto">Login credentials</param>
    /// <returns>Authentication response with user info and token</returns>
    /// <response code="200">Returns the authenticated user info and token</response>
    /// <response code="401">If credentials are invalid</response>
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto dto)
    {
        _logger.LogInformation("Login attempt for email: {Email}", dto.Email);

        // Find user by email
        var user = await _context.Users.FirstOrDefaultAsync(u => 
            u.Email == dto.Email.ToLowerInvariant());

        if (user == null)
        {
            _logger.LogWarning("Login failed: User not found for email {Email}", dto.Email);
            return Unauthorized(new { message = "Invalid email or password" });
        }

        // Verify password (plain text comparison for demo - use hashing in production!)
        if (user.Password != dto.Password)
        {
            _logger.LogWarning("Login failed: Invalid password for email {Email}", dto.Email);
            return Unauthorized(new { message = "Invalid email or password" });
        }

        // Generate placeholder token (will be JWT in production)
        var token = GeneratePlaceholderToken(user);

        var response = AuthResponseDto.FromUser(user, token);
        _logger.LogInformation("User logged in successfully: {UserId}", user.Id);

        return Ok(response);
    }

    /// <summary>
    /// Login with Google ID Token
    /// </summary>
    /// <param name="dto">Google login data containing the ID Token</param>
    /// <returns>Authentication response with user info and token</returns>
    [HttpPost("google-login")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponseDto>> GoogleLogin([FromBody] GoogleLoginDto dto)
    {
        _logger.LogInformation("Google login attempt");

        try
        {
            var payload = await GoogleJsonWebSignature.ValidateAsync(dto.IdToken, new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] 
                { 
                    "606890091839-cabq6kfrt1i2pctssr54ctli4no5lhcq.apps.googleusercontent.com",
                    "606890091839-a8m279ndrediv5j0o0nn6o75fubb30l1.apps.googleusercontent.com"
                }
            });

            var email = payload.Email.ToLowerInvariant();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

            if (user == null)
            {
                _logger.LogInformation("New user from Google login: {Email}", email);
                user = new User
                {
                    Id = Guid.NewGuid(),
                    Name = payload.Name,
                    Email = email,
                    Password = Guid.NewGuid().ToString(), // Random password for Google users
                    Role = UserRole.Elderly,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Users.Add(user);
                await _context.SaveChangesAsync();
            }

            var token = GeneratePlaceholderToken(user);
            var response = AuthResponseDto.FromUser(user, token);

            _logger.LogInformation("User logged in via Google successfully: {UserId}", user.Id);
            return Ok(response);
        }
        catch (InvalidJwtException ex)
        {
            _logger.LogWarning(ex, "Invalid Google ID Token");
            return Unauthorized(new { message = "Invalid Google ID Token" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Google login error");
            return StatusCode(500, new { message = "An error occurred during Google login" });
        }
    }

    /// <summary>
    /// Get current user information (simulated - requires token validation in production)
    /// </summary>
    /// <param name="token">Authorization token from header</param>
    /// <returns>User information</returns>
    /// <response code="200">Returns the user information</response>
    /// <response code="401">If token is invalid or missing</response>
    [HttpGet("me")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponseDto>> GetCurrentUser([FromHeader(Name = "Authorization")] string? token)
    {
        _logger.LogInformation("Get current user request");

        if (string.IsNullOrEmpty(token))
        {
            _logger.LogWarning("Get current user failed: No authorization token provided");
            return Unauthorized(new { message = "Authorization token required" });
        }

        // Remove "Bearer " prefix if present
        var actualToken = token.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
            ? token.Substring(7)
            : token;

        // Parse user ID from placeholder token
        // Format: "demo-token-{userId}"
        if (!actualToken.StartsWith("demo-token-"))
        {
            _logger.LogWarning("Get current user failed: Invalid token format");
            return Unauthorized(new { message = "Invalid token" });
        }

        var userIdString = actualToken.Substring(11);
        if (!Guid.TryParse(userIdString, out var userId))
        {
            _logger.LogWarning("Get current user failed: Invalid user ID in token");
            return Unauthorized(new { message = "Invalid token" });
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null)
        {
            _logger.LogWarning("Get current user failed: User not found for ID {UserId}", userId);
            return Unauthorized(new { message = "Invalid token" });
        }

        var response = AuthResponseDto.FromUser(user, actualToken);
        _logger.LogInformation("Current user retrieved: {UserId}", user.Id);

        return Ok(response);
    }

    /// <summary>
    /// Create a new elderly account and link it to the caregiver
    /// </summary>
    [HttpPost("create-elderly")]
    public async Task<ActionResult<AuthResponseDto>> CreateAndLinkElderly([FromBody] CreateElderlyDto dto)
    {
        _logger.LogInformation("Create elderly request from caregiver: {CaregiverId}", dto.CaregiverId);

        if (await _context.Users.AnyAsync(u => u.Email == dto.Email.ToLowerInvariant()))
        {
            return BadRequest(new { message = "Email already exists" });
        }

        var elderly = new User
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Email = dto.Email.ToLowerInvariant(),
            Password = dto.Password,
            Role = UserRole.Elderly,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(elderly);
        
        var connection = new UserConnection
        {
            Id = Guid.NewGuid(),
            CaregiverId = dto.CaregiverId,
            ElderlyId = elderly.Id,
            ConnectedAt = DateTime.UtcNow
        };

        _context.UserConnections.Add(connection);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Elderly user created and linked: {ElderlyId} to {CaregiverId}", elderly.Id, dto.CaregiverId);
        
        return Ok(AuthResponseDto.FromUser(elderly, GeneratePlaceholderToken(elderly)));
    }

    /// <summary>
    /// Get list of elderly users managed by a caregiver
    /// </summary>
    [HttpGet("managed-elderly/{caregiverId}")]
    public async Task<ActionResult<IEnumerable<User>>> GetManagedElderly(Guid caregiverId)
    {
        var connections = await _context.UserConnections
            .Where(c => c.CaregiverId == caregiverId)
            .Select(c => c.ElderlyId)
            .ToListAsync();

        var elderlyUsers = await _context.Users
            .Where(u => connections.Contains(u.Id))
            .ToListAsync();

        return Ok(elderlyUsers);
    }

    /// <summary>
    /// Generates a placeholder token for demo purposes.
    /// In production, this should generate a proper JWT token.
    /// </summary>
    private static string GeneratePlaceholderToken(User user)
    {
        // Simple placeholder format: "demo-token-{userId}"
        // In production, use JWT with proper claims and expiration
        return $"demo-token-{user.Id}";
    }
}
