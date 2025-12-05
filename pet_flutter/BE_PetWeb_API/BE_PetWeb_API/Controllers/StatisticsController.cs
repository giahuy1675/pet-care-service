using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BE_PetWeb_API.Models;
using BE_PetWeb_API.Services;
using BE_PetWeb_API.Services.Interfaces;
using System.Linq;

namespace BE_PetWeb_API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StatisticsController : ControllerBase
    {
        private readonly PetWebContext _context;
        private readonly ILogger<StatisticsController> _logger;
        private readonly IDateTimeService _dateTimeService;

        public StatisticsController(
            PetWebContext context, 
            ILogger<StatisticsController> logger,
            IDateTimeService dateTimeService)
        {
            _context = context;
            _logger = logger;
            _dateTimeService = dateTimeService;
        }

        // GET: api/Statistics/appointments/overview
        [HttpGet("appointments/overview")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<object>> GetAppointmentsOverview(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                // Nếu không có startDate/endDate, lấy 30 ngày gần nhất
                var start = startDate ?? _dateTimeService.Now.AddDays(-30);
                var end = endDate ?? _dateTimeService.Now;

                var appointments = await _context.Appointments
                    .Include(a => a.Service)
                    .Where(a => a.AppointmentDate >= start && a.AppointmentDate <= end)
                    .ToListAsync();

                // Tổng số lịch hẹn theo trạng thái
                var statusCounts = appointments
                    .GroupBy(a => a.Status)
                    .Select(g => new
                    {
                        Status = g.Key,
                        Count = g.Count(),
                        Percentage = Math.Round((double)g.Count() / appointments.Count * 100, 2)
                    })
                    .ToList();

                // Tổng số lịch hẹn
                var totalAppointments = appointments.Count;
                var completedCount = appointments.Count(a => a.Status == "Completed");
                var cancelledCount = appointments.Count(a => a.Status == "Cancelled");
                var pendingCount = appointments.Count(a => a.Status == "Pending");
                var confirmedCount = appointments.Count(a => a.Status == "Confirmed");
                var scheduledCount = appointments.Count(a => a.Status == "Scheduled");
                var noShowCount = appointments.Count(a => a.Status == "No-Show");

                // Tỷ lệ hoàn thành/hủy
                var completionRate = totalAppointments > 0 
                    ? Math.Round((double)completedCount / totalAppointments * 100, 2) 
                    : 0;
                var cancellationRate = totalAppointments > 0 
                    ? Math.Round((double)cancelledCount / totalAppointments * 100, 2) 
                    : 0;

                return Ok(new
                {
                    period = new { startDate = start, endDate = end },
                    totalAppointments,
                    statusBreakdown = new
                    {
                        completed = completedCount,
                        cancelled = cancelledCount,
                        pending = pendingCount,
                        confirmed = confirmedCount,
                        scheduled = scheduledCount,
                        noShow = noShowCount
                    },
                    statusCounts,
                    rates = new
                    {
                        completionRate,
                        cancellationRate
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy thống kê tổng quan lịch hẹn");
                return StatusCode(500, "Có lỗi xảy ra khi lấy thống kê");
            }
        }

        // GET: api/Statistics/appointments/revenue
        [HttpGet("appointments/revenue")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<object>> GetRevenueStatistics(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var start = startDate ?? _dateTimeService.Now.AddDays(-30);
                var end = endDate ?? _dateTimeService.Now;

                // CHỈ tính doanh thu từ lịch hẹn đã hoàn thành
                var completedAppointments = await _context.Appointments
                    .Include(a => a.Service)
                    .Where(a => a.Status == "Completed" 
                        && a.AppointmentDate >= start 
                        && a.AppointmentDate <= end)
                    .ToListAsync();

                // Tổng doanh thu
                var totalRevenue = completedAppointments
                    .Where(a => a.Service != null)
                    .Sum(a => a.Service.Price);

                // Doanh thu theo ngày
                var revenueByDate = completedAppointments
                    .Where(a => a.Service != null)
                    .GroupBy(a => a.AppointmentDate.Date)
                    .Select(g => new
                    {
                        Date = g.Key.ToString("yyyy-MM-dd"),
                        Revenue = g.Sum(a => a.Service.Price),
                        Count = g.Count()
                    })
                    .OrderBy(x => x.Date)
                    .ToList();

                // Doanh thu theo tháng
                var revenueByMonth = completedAppointments
                    .Where(a => a.Service != null)
                    .GroupBy(a => new { a.AppointmentDate.Year, a.AppointmentDate.Month })
                    .Select(g => new
                    {
                        Year = g.Key.Year,
                        Month = g.Key.Month,
                        Revenue = g.Sum(a => a.Service.Price),
                        Count = g.Count()
                    })
                    .OrderBy(x => x.Year).ThenBy(x => x.Month)
                    .ToList();

                // Doanh thu trung bình mỗi lịch hẹn
                var averageRevenue = completedAppointments.Count > 0
                    ? Math.Round(totalRevenue / completedAppointments.Count, 2)
                    : 0;

                return Ok(new
                {
                    period = new { startDate = start, endDate = end },
                    totalRevenue,
                    averageRevenue,
                    completedAppointments = completedAppointments.Count,
                    revenueByDate,
                    revenueByMonth
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy thống kê doanh thu");
                return StatusCode(500, "Có lỗi xảy ra khi lấy thống kê doanh thu");
            }
        }

        // GET: api/Statistics/services/popular
        [HttpGet("services/popular")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<object>> GetPopularServices(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] int top = 10)
        {
            try
            {
                var start = startDate ?? _dateTimeService.Now.AddDays(-30);
                var end = endDate ?? _dateTimeService.Now;

                var serviceStats = await _context.Appointments
                    .Include(a => a.Service)
                    .Where(a => a.AppointmentDate >= start && a.AppointmentDate <= end)
                    .GroupBy(a => new { a.ServiceId, a.Service.Name, a.Service.Price })
                    .Select(g => new
                    {
                        ServiceId = g.Key.ServiceId,
                        ServiceName = g.Key.Name,
                        Price = g.Key.Price,
                        TotalBookings = g.Count(),
                        CompletedBookings = g.Count(a => a.Status == "Completed"),
                        CancelledBookings = g.Count(a => a.Status == "Cancelled"),
                        Revenue = g.Where(a => a.Status == "Completed").Count() * g.Key.Price,
                        CompletionRate = g.Count() > 0 
                            ? Math.Round((double)g.Count(a => a.Status == "Completed") / g.Count() * 100, 2)
                            : 0
                    })
                    .OrderByDescending(x => x.TotalBookings)
                    .Take(top)
                    .ToListAsync();

                return Ok(new
                {
                    period = new { startDate = start, endDate = end },
                    topServices = serviceStats
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy thống kê dịch vụ phổ biến");
                return StatusCode(500, "Có lỗi xảy ra khi lấy thống kê dịch vụ");
            }
        }

        // GET: api/Statistics/staff/performance
        [HttpGet("staff/performance")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<object>> GetStaffPerformance(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var start = startDate ?? _dateTimeService.Now.AddDays(-30);
                var end = endDate ?? _dateTimeService.Now;

                var staffStats = await _context.Appointments
                    .Include(a => a.Staff)
                        .ThenInclude(s => s.User)
                    .Include(a => a.Service)
                    .Where(a => a.StaffId != null 
                        && a.AppointmentDate >= start 
                        && a.AppointmentDate <= end)
                    .GroupBy(a => new { a.StaffId, StaffName = a.Staff.User.FullName })
                    .Select(g => new
                    {
                        StaffId = g.Key.StaffId,
                        StaffName = g.Key.StaffName,
                        TotalAppointments = g.Count(),
                        CompletedAppointments = g.Count(a => a.Status == "Completed"),
                        CancelledAppointments = g.Count(a => a.Status == "Cancelled"),
                        NoShowAppointments = g.Count(a => a.Status == "No-Show"),
                        Revenue = g.Where(a => a.Status == "Completed" && a.Service != null)
                                   .Sum(a => a.Service.Price),
                        CompletionRate = g.Count() > 0 
                            ? Math.Round((double)g.Count(a => a.Status == "Completed") / g.Count() * 100, 2)
                            : 0,
                        CancellationRate = g.Count() > 0
                            ? Math.Round((double)g.Count(a => a.Status == "Cancelled") / g.Count() * 100, 2)
                            : 0
                    })
                    .OrderByDescending(x => x.TotalAppointments)
                    .ToListAsync();

                // Lấy danh sách nhân viên chưa có lịch hẹn nào
                var staffWithoutAppointments = await _context.Users
                    .Where(u => u.Role == "Staff" 
                        && !_context.Appointments.Any(a => a.StaffId == u.UserId 
                            && a.AppointmentDate >= start 
                            && a.AppointmentDate <= end))
                    .Select(u => new
                    {
                        StaffId = (int?)u.UserId,
                        StaffName = u.FullName,
                        TotalAppointments = 0,
                        CompletedAppointments = 0,
                        CancelledAppointments = 0,
                        NoShowAppointments = 0,
                        Revenue = 0m,
                        CompletionRate = 0.0,
                        CancellationRate = 0.0
                    })
                    .ToListAsync();

                var allStaffStats = staffStats.Concat(staffWithoutAppointments).ToList();

                return Ok(new
                {
                    period = new { startDate = start, endDate = end },
                    totalStaff = allStaffStats.Count,
                    staffPerformance = allStaffStats
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy thống kê hiệu suất nhân viên");
                return StatusCode(500, "Có lỗi xảy ra khi lấy thống kê nhân viên");
            }
        }

        // GET: api/Statistics/dashboard
        [HttpGet("dashboard")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<object>> GetDashboardStatistics(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var start = startDate ?? _dateTimeService.Now.AddDays(-30);
                var end = endDate ?? _dateTimeService.Now;

                var appointments = await _context.Appointments
                    .Include(a => a.Service)
                    .Where(a => a.AppointmentDate >= start && a.AppointmentDate <= end)
                    .ToListAsync();

                // Tổng quan
                var totalAppointments = appointments.Count;
                var completedCount = appointments.Count(a => a.Status == "Completed");
                var totalRevenue = appointments
                    .Where(a => a.Status == "Completed" && a.Service != null)
                    .Sum(a => a.Service.Price);

                // Top 5 dịch vụ
                var topServices = appointments
                    .Where(a => a.Service != null)
                    .GroupBy(a => a.Service.Name)
                    .Select(g => new
                    {
                        ServiceName = g.Key,
                        Count = g.Count()
                    })
                    .OrderByDescending(x => x.Count)
                    .Take(5)
                    .ToList();

                // Lịch hẹn theo ngày (7 ngày gần nhất)
                var recentDays = appointments
                    .GroupBy(a => a.AppointmentDate.Date)
                    .Select(g => new
                    {
                        Date = g.Key.ToString("yyyy-MM-dd"),
                        Count = g.Count()
                    })
                    .OrderByDescending(x => x.Date)
                    .Take(7)
                    .ToList();

                return Ok(new
                {
                    period = new { startDate = start, endDate = end },
                    summary = new
                    {
                        totalAppointments,
                        completedAppointments = completedCount,
                        totalRevenue,
                        averageRevenue = completedCount > 0 ? Math.Round(totalRevenue / completedCount, 2) : 0
                    },
                    topServices,
                    recentActivity = recentDays
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy thống kê dashboard");
                return StatusCode(500, "Có lỗi xảy ra khi lấy thống kê dashboard");
            }
        }

        // GET: api/Statistics/comparison
        [HttpGet("comparison")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<object>> GetComparison(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var start = startDate ?? _dateTimeService.Now.AddDays(-30);
                var end = endDate ?? _dateTimeService.Now;

                // Tính khoảng thời gian so sánh (cùng độ dài với khoảng hiện tại)
                var duration = (end - start).Days;
                var prevStart = start.AddDays(-duration - 1);
                var prevEnd = start.AddDays(-1);

                // Dữ liệu kỳ hiện tại
                var currentAppointments = await _context.Appointments
                    .Include(a => a.Service)
                    .Where(a => a.AppointmentDate >= start && a.AppointmentDate <= end)
                    .ToListAsync();

                var currentTotal = currentAppointments.Count;
                var currentCompleted = currentAppointments.Count(a => a.Status == "Completed");
                var currentRevenue = currentAppointments
                    .Where(a => a.Status == "Completed" && a.Service != null)
                    .Sum(a => a.Service.Price);

                // Dữ liệu kỳ trước
                var previousAppointments = await _context.Appointments
                    .Include(a => a.Service)
                    .Where(a => a.AppointmentDate >= prevStart && a.AppointmentDate <= prevEnd)
                    .ToListAsync();

                var previousTotal = previousAppointments.Count;
                var previousCompleted = previousAppointments.Count(a => a.Status == "Completed");
                var previousRevenue = previousAppointments
                    .Where(a => a.Status == "Completed" && a.Service != null)
                    .Sum(a => a.Service.Price);

                // Tính % thay đổi
                var totalChange = previousTotal > 0 
                    ? Math.Round(((double)(currentTotal - previousTotal) / previousTotal) * 100, 2)
                    : 0;
                var completedChange = previousCompleted > 0
                    ? Math.Round(((double)(currentCompleted - previousCompleted) / previousCompleted) * 100, 2)
                    : 0;
                var revenueChange = previousRevenue > 0
                    ? Math.Round(((double)(currentRevenue - previousRevenue) / (double)previousRevenue) * 100, 2)
                    : 0;

                return Ok(new
                {
                    current = new
                    {
                        totalAppointments = currentTotal,
                        completedAppointments = currentCompleted,
                        revenue = currentRevenue
                    },
                    previous = new
                    {
                        totalAppointments = previousTotal,
                        completedAppointments = previousCompleted,
                        revenue = previousRevenue
                    },
                    change = new
                    {
                        totalAppointmentsPercent = totalChange,
                        completedAppointmentsPercent = completedChange,
                        revenuePercent = revenueChange
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy thống kê so sánh");
                return StatusCode(500, "Có lỗi xảy ra khi lấy thống kê so sánh");
            }
        }

        // GET: api/Statistics/appointments/by-hour
        [HttpGet("appointments/by-hour")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<object>> GetAppointmentsByHour(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var start = startDate ?? _dateTimeService.Now.AddDays(-30);
                var end = endDate ?? _dateTimeService.Now;

                var appointments = await _context.Appointments
                    .Where(a => a.AppointmentDate >= start && a.AppointmentDate <= end)
                    .ToListAsync();

                // Group theo giờ
                var hourlyStats = appointments
                    .GroupBy(a => a.AppointmentDate.Hour)
                    .Select(g => new
                    {
                        Hour = g.Key,
                        TimeSlot = $"{g.Key:D2}:00 - {(g.Key + 1):D2}:00",
                        Count = g.Count(),
                        CompletedCount = g.Count(a => a.Status == "Completed"),
                        CancelledCount = g.Count(a => a.Status == "Cancelled")
                    })
                    .OrderBy(x => x.Hour)
                    .ToList();

                return Ok(new
                {
                    period = new { startDate = start, endDate = end },
                    hourlyStats
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy thống kê theo giờ");
                return StatusCode(500, "Có lỗi xảy ra khi lấy thống kê theo giờ");
            }
        }

        // GET: api/Statistics/customers/top
        [HttpGet("customers/top")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<object>> GetTopCustomers(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] int top = 10)
        {
            try
            {
                var start = startDate ?? _dateTimeService.Now.AddDays(-30);
                var end = endDate ?? _dateTimeService.Now;

                var topCustomers = await _context.Appointments
                    .Include(a => a.User)
                    .Include(a => a.Service)
                    .Where(a => a.AppointmentDate >= start && a.AppointmentDate <= end)
                    .GroupBy(a => new { a.UserId, a.User.FullName, a.User.Email, a.User.Phone })
                    .Select(g => new
                    {
                        UserId = g.Key.UserId,
                        CustomerName = g.Key.FullName,
                        Email = g.Key.Email,
                        Phone = g.Key.Phone,
                        TotalAppointments = g.Count(),
                        CompletedAppointments = g.Count(a => a.Status == "Completed"),
                        CancelledAppointments = g.Count(a => a.Status == "Cancelled"),
                        TotalSpent = g.Where(a => a.Status == "Completed" && a.Service != null)
                                      .Sum(a => a.Service.Price)
                    })
                    .OrderByDescending(x => x.TotalAppointments)
                    .Take(top)
                    .ToListAsync();

                return Ok(new
                {
                    period = new { startDate = start, endDate = end },
                    topCustomers
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy top khách hàng");
                return StatusCode(500, "Có lỗi xảy ra khi lấy top khách hàng");
            }
        }
    }
}
