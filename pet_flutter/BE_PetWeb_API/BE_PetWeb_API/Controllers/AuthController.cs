using BE_PetWeb_API.DTOs.Auth;
using BE_PetWeb_API.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;

namespace BE_PetWeb_API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(IAuthService authService, ILogger<AuthController> logger)
        {
            _authService = authService;
            _logger = logger;
        }

        [HttpPost("register")]
        public async Task<ActionResult<AuthResponseDto>> Register(RegisterDto registerDto)
        {
            try
            {
                var result = await _authService.Register(registerDto);
                return Ok(result);
            }
            catch (DbUpdateException ex)
            {
                string errorMessage = ex.InnerException?.Message ?? ex.Message;

                if (errorMessage.Contains("UQ__Users__536C85E4") || errorMessage.Contains("Username"))
                {
                    return BadRequest("Username đã tồn tại trong hệ thống");
                }
                else if (errorMessage.Contains("UQ__Users__A9D10534") || errorMessage.Contains("Email"))
                {
                    return BadRequest("Email đã tồn tại trong hệ thống");
                }

                _logger.LogError(ex, "Database error during registration");
                return BadRequest("Đã xảy ra lỗi trong quá trình đăng ký. Vui lòng thử lại.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during registration");
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("login")]
        public async Task<ActionResult<AuthResponseDto>> Login(LoginDto loginDto)
        {
            try
            {
                var result = await _authService.Login(loginDto);

                return Ok(new
                {
                    token = result.Token,
                    user = new
                    {
                        userId = result.UserId,
                        username = result.Username,
                        fullName = result.FullName,
                        email = result.Email,
                        role = result.Role,
                        isActive = true,
                        staffId = result.StaffId
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Login failed for {UsernameOrEmail}", loginDto.UsernameOrEmail);
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("external-login")]
        public async Task<ActionResult<AuthResponseDto>> ExternalLogin(ExternalAuthDto externalAuth)
        {
            try
            {
                var result = await _authService.ExternalLogin(externalAuth);

                return Ok(new
                {
                    token = result.Token,
                    user = new
                    {
                        userId = result.UserId,
                        username = result.Username,
                        fullName = result.FullName,
                        email = result.Email,
                        role = result.Role,
                        isActive = true
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "External login failed for provider {Provider}", externalAuth.Provider);
                return BadRequest(ex.Message);
            }
        }
    }
}