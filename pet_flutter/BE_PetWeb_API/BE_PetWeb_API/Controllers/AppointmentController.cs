namespace BE_PetWeb_API.Controllers
{
    using BE_PetWeb_API.DTOs.Appointment;
    using BE_PetWeb_API.Models;
    using BE_PetWeb_API.Services.Interfaces;
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;
    using Microsoft.EntityFrameworkCore;
    using System.Security.Claims;

    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AppointmentsController : ControllerBase
    {
        private readonly IAppointmentService _appointmentService;
        private readonly IStaffService _staffService;
        private readonly PetWebContext _context;
        private readonly ILogger<AppointmentsController> _logger;

        private const int BUFFER_TIME_MINUTES = 10;
        private const int DEFAULT_SLOT_INTERVAL_MINUTES = 30;
        private const int DEFAULT_SERVICE_DURATION_MINUTES = 30;
        private const int BOOKING_BUFFER_MINUTES = 30;

        public AppointmentsController(
            IAppointmentService appointmentService,
            IStaffService staffService,
            PetWebContext context,
            ILogger<AppointmentsController> logger)
        {
            _appointmentService = appointmentService;
            _staffService = staffService;
            _context = context;
            _logger = logger;
        }

        [HttpGet("Pet/{id}/busy-slots")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<string>>> GetPetBusyTimeSlots(int id, [FromQuery] DateTime date)
        {
            try
            {
                var busyTimeSlots = await GetPetBusyTimeSlotsInternal(id, date);

                // Trả về kết quả như mảng chuỗi giờ:phút
                return Ok(busyTimeSlots);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting busy slots for pet {id} on date {date}");
                return StatusCode(500, new { message = ex.Message, stackTrace = ex.StackTrace });
            }
        }

        private async Task<List<string>> GetPetBusyTimeSlotsInternal(int petId, DateTime date)
        {
            var busyTimeSlots = new List<string>();

            try
            {
                var appointments = await _context.Appointments
                    .Include(a => a.Service) // Thêm Service để lấy thời lượng dịch vụ
                    .Where(a => a.PetId == petId &&
                           a.AppointmentDate.Date == date.Date &&
                           a.Status != "Cancelled" && a.Status != "No-Show" && a.Status != "Completed")
                    .OrderBy(a => a.AppointmentDate)
                    .ToListAsync();

                foreach (var appointment in appointments)
                {
                    var startTime = appointment.AppointmentDate;                    // Ưu tiên dùng EndTime nếu có, nếu không thì tính từ thời lượng dịch vụ
                    var serviceDuration = appointment.Service?.Duration ?? DEFAULT_SERVICE_DURATION_MINUTES;
                    var endTime = appointment.EndTime ?? startTime.AddMinutes(serviceDuration);

                    // Thêm buffer time sau mỗi cuộc hẹn
                    endTime = endTime.AddMinutes(BUFFER_TIME_MINUTES);

                    // Thêm tất cả các khung giờ display (30 phút) bị ảnh hưởng trong khoảng thời gian appointment + buffer
                    // Note: Sử dụng DEFAULT_SLOT_INTERVAL_MINUTES cho việc hiển thị UI, không phải cho appointment logic
                    for (DateTime time = new DateTime(date.Year, date.Month, date.Day, 8, 0, 0);
                         time <= new DateTime(date.Year, date.Month, date.Day, 21, 30, 0);
                         time = time.AddMinutes(DEFAULT_SLOT_INTERVAL_MINUTES))
                    {
                        DateTime slotEnd = time.AddMinutes(DEFAULT_SLOT_INTERVAL_MINUTES);
                        
                        // Kiểm tra xem slot display này có bị ảnh hưởng bởi appointment + buffer không
                        if ((time >= startTime && time < endTime) ||
                            (slotEnd > startTime && slotEnd <= endTime) ||
                            (time <= startTime && slotEnd >= endTime))
                        {
                            busyTimeSlots.Add(time.ToString("HH:mm"));
                        }
                    }
                }

                return busyTimeSlots.Distinct().ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error in GetPetBusyTimeSlotsInternal for pet {petId} on date {date}");
                // Trả về danh sách trống thay vì throw exception
                return new List<string>();
            }
        }

        [HttpGet("available-slots")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<DTOs.Appointment.TimeSlotDto>>> GetAvailableSlots(
            [FromQuery] DateTime date,
            [FromQuery] int serviceId,
            [FromQuery] int? staffIdParam,
            [FromQuery] int? petId = null,
            [FromQuery] bool includeUnavailable = true,
            [FromQuery] bool debug = false)
        {
            try
            {
                // Kiểm tra service tồn tại và thời lượng hợp lệ
                var service = await _context.Services.FindAsync(serviceId);
                if (service == null)
                    return BadRequest("Service not found");
                
                if (service.Duration <= 0)
                    return BadRequest("Không thể tạo khung giờ: Thời lượng dịch vụ không hợp lệ hoặc không tìm thấy thông tin dịch vụ.");

                // Kiểm tra nhân viên tồn tại nếu có chỉ định
                if (staffIdParam.HasValue)
                {
                    var staff = await _context.Staff.FindAsync(staffIdParam.Value);
                    if (staff == null)
                        return BadRequest("Staff not found");

                    // Kiểm tra lịch làm việc của nhân viên trong ngày
                    var staffSchedule = await _context.StaffSchedules
                        .FirstOrDefaultAsync(ss => ss.StaffId == staffIdParam.Value && ss.Date.Date == date.Date);

                    // Nếu có lịch và không làm việc, trả về danh sách trống
                    if (staffSchedule != null && !staffSchedule.IsWorking)
                    {
                        return Ok(new
                        {
                            slots = new List<DTOs.Appointment.TimeSlotDto>(),
                            metadata = new
                            {
                                Date = date.ToString("yyyy-MM-dd"),
                                StaffNotWorking = true
                            }
                        });
                    }
                }

                // Lấy danh sách slots từ service
                var slots = await _appointmentService.GetAvailableTimeSlotsAsync(date, serviceId, staffIdParam, includeUnavailable, petId);

                // Thêm thuộc tính SelectedDate cho mỗi slot
                foreach (var slot in slots)
                {
                    slot.SelectedDate = date.ToString("yyyy-MM-dd");                    // Đảm bảo có buffer time
                    if (!slot.BufferTime.HasValue)
                    {
                        slot.BufferTime = BUFFER_TIME_MINUTES; // Sử dụng constant
                    }

                    if (!slot.BufferEndTime.HasValue)
                    {
                        slot.BufferEndTime = slot.EndTime.AddMinutes(slot.BufferTime.Value);
                    }
                }

                // Thêm xử lý thú cưng nếu có
                if (petId.HasValue)
                {
                    var petBusySlots = await GetPetBusyTimeSlotsInternal(petId.Value, date);

                    // Đánh dấu các slot bận của thú cưng
                    foreach (var slot in slots)
                    {
                        var slotTime = slot.StartTime.ToString("HH:mm");
                        if (petBusySlots.Contains(slotTime))
                        {
                            slot.Available = false;
                            slot.IsAvailable = false;
                            slot.IsPetBusy = true;
                            slot.UnavailableReason = "Thú cưng đã có lịch hẹn vào khung giờ này";
                        }
                    }
                }                // Đánh dấu các khung giờ trong quá khứ
                // Cập nhật: Thêm buffer để tránh đặt lịch quá gần thời gian hiện tại
                var now = DateTime.Now;
                var bufferForBooking = TimeSpan.FromMinutes(BOOKING_BUFFER_MINUTES); // Buffer cho việc đặt lịch
                var cutoffTime = now.Add(bufferForBooking);

                foreach (var slot in slots)
                {
                    // Sửa lại: Chỉ áp dụng kiểm tra khung giờ đã qua cho ngày hiện tại, không áp dụng cho các ngày trong tương lai
                    var slotDate = DateTime.Parse(slot.SelectedDate);

                    // Chỉ áp dụng kiểm tra với ngày hiện tại
                    if (slotDate.Date == now.Date && slot.StartTime <= cutoffTime)
                    {
                        slot.Available = false;
                        slot.IsAvailable = false;
                        slot.IsPast = true;
                        slot.IsPastTime = true;
                        if (string.IsNullOrEmpty(slot.UnavailableReason))
                        {
                            slot.UnavailableReason = "Khung giờ đã qua hoặc quá gần để đặt lịch";
                        }
                    }

                    // Kiểm tra xem slot có nằm trong giờ làm việc không
                    var startTimeOfDay = slot.StartTime.TimeOfDay;
                    var endTimeOfDay = slot.EndTime.TimeOfDay;
                    var openingTime = new TimeSpan(8, 0, 0);
                    var closingTime = new TimeSpan(21, 30, 0);

                    slot.IsWithinWorkingHours =
                        startTimeOfDay >= openingTime &&
                        startTimeOfDay <= closingTime &&
                        endTimeOfDay <= closingTime;

                    if (!slot.IsWithinWorkingHours && string.IsNullOrEmpty(slot.UnavailableReason))
                    {
                        slot.Available = false;
                        slot.IsAvailable = false;
                        slot.UnavailableReason = "Ngoài giờ làm việc (8:00 - 21:30)";
                    }
                }

                // Nếu không có slot nào, có thể tạo các slot mặc định
                if ((slots == null || !slots.Any()) && !staffIdParam.HasValue)
                {
                    // Tạo các slot mặc định cho ngày đã chọn
                    var defaultSlots = GenerateDefaultSlots(date, service.Duration);

                    // Nếu có thú cưng, đánh dấu các slot bận
                    if (petId.HasValue)
                    {
                        var petBusySlots = await GetPetBusyTimeSlotsInternal(petId.Value, date);
                        foreach (var slot in defaultSlots)
                        {
                            var slotTime = slot.StartTime.ToString("HH:mm");
                            if (petBusySlots.Contains(slotTime))
                            {
                                slot.Available = false;
                                slot.IsAvailable = false;
                                slot.IsPetBusy = true;
                                slot.UnavailableReason = "Thú cưng đã có lịch hẹn vào khung giờ này";
                            }

                            // Đánh dấu các khung giờ trong quá khứ
                            // Cập nhật: Thêm buffer 30 phút
                            var slotDate = DateTime.Parse(slot.SelectedDate);

                            // Chỉ áp dụng kiểm tra với ngày hiện tại
                            if (slotDate.Date == now.Date && slot.StartTime <= cutoffTime)
                            {
                                slot.Available = false;
                                slot.IsAvailable = false;
                                slot.IsPast = true;
                                slot.IsPastTime = true;
                                if (string.IsNullOrEmpty(slot.UnavailableReason))
                                {
                                    slot.UnavailableReason = "Khung giờ đã qua hoặc quá gần để đặt lịch";
                                }
                            }

                            // Thêm thuộc tính SelectedDate cho mỗi slot
                            slot.SelectedDate = date.ToString("yyyy-MM-dd");
                        }
                    }

                    // Thêm metadata vào response
                    var metadata = new
                    {
                        Date = date.ToString("yyyy-MM-dd"),
                        ServiceId = serviceId,
                        ServiceName = service.Name,
                        ServiceDuration = service.Duration,
                        PetId = petId,
                        StaffId = staffIdParam,
                        HasDefaultSlots = true,
                        TotalSlots = defaultSlots.Count,
                        AvailableSlots = defaultSlots.Count(s => s.Available),
                        PetBusySlots = petId.HasValue ? defaultSlots.Count(s => s.IsPetBusy) : 0,
                        BusinessHours = new
                        {
                            Open = "08:00",
                            Close = "21:30"
                        }
                    };

                    return Ok(new { slots = defaultSlots, metadata });
                }

                // Thêm metadata vào response
                var responseMetadata = new
                {
                    Date = date.ToString("yyyy-MM-dd"),
                    ServiceId = serviceId,
                    ServiceName = service.Name,
                    ServiceDuration = service.Duration,
                    PetId = petId,
                    StaffId = staffIdParam,
                    HasDefaultSlots = false,
                    TotalSlots = slots.Count,
                    AvailableSlots = slots.Count(s => s.Available),
                    PetBusySlots = petId.HasValue ? slots.Count(s => s.IsPetBusy) : 0,
                    BusinessHours = new
                    {
                        Open = "08:00",
                        Close = "21:30"
                    }
                };

                return Ok(new { slots, metadata = responseMetadata });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetAvailableSlots");

                try
                {
                    var service = await _context.Services.FindAsync(serviceId);
                    if (service != null)
                    {
                        // Nếu có lỗi, trả về danh sách mặc định
                        var defaultSlots = GenerateDefaultSlots(date, service.Duration);
                        return Ok(new
                        {
                            slots = defaultSlots,
                            metadata = new
                            {
                                error = true,
                                errorMessage = ex.Message,
                                date = date.ToString("yyyy-MM-dd"),
                                serviceId = serviceId,
                                serviceDuration = service.Duration,
                                totalSlots = defaultSlots.Count
                            }
                        });
                    }
                }
                catch (Exception innerEx)
                {
                    _logger.LogError(innerEx, "Error generating default slots after exception");
                }

                return StatusCode(500, new { message = ex.Message, stackTrace = ex.StackTrace });
            }
        }

        [HttpGet("Pet/{id}")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<AppointmentDto>>> GetPetAppointments(int id, [FromQuery] DateTime? date)
        {
            try
            {
                var query = _context.Appointments
                    .Include(a => a.User)
                    .Include(a => a.Pet)
                    .Include(a => a.Service)
                    .Include(a => a.Staff)
                    .Where(a => a.PetId == id);

                if (date.HasValue)
                {
                    var startDate = date.Value.Date;
                    var endDate = startDate.AddDays(1).AddTicks(-1);
                    query = query.Where(a => a.AppointmentDate >= startDate && a.AppointmentDate <= endDate);
                }

                var appointments = await query
                    .OrderBy(a => a.AppointmentDate)
                    .Select(a => new AppointmentDto
                    {
                        AppointmentId = a.AppointmentId,
                        UserId = a.UserId,
                        UserName = a.User.FullName,
                        PetId = a.PetId,
                        PetName = a.Pet.Name,
                        ServiceId = a.ServiceId,
                        ServiceName = a.Service.Name,
                        ServicePrice = a.Service.Price,
                        StaffId = a.StaffId,
                        StaffName = a.Staff != null ? a.Staff.User.FullName : null,
                        AppointmentDate = a.AppointmentDate,
                        EndTime = a.EndTime,
                        Status = a.Status,
                        Notes = a.Notes
                    })
                    .ToListAsync();

                return Ok(appointments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting appointments for pet {id}");
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPatch("{id}/complete")]
        [Authorize]
        public async Task<ActionResult<AppointmentDto>> CompleteAppointment(int id, [FromBody] CompleteAppointmentDto completeDto)
        {
            try
            {
                var updatedAppointment = await _appointmentService.UpdateCompletionTimeAsync(
                    id, completeDto.ActualCompletionTime, completeDto.Notes);

                if (updatedAppointment == null)
                {
                    return NotFound("Appointment not found");
                }

                return Ok(updatedAppointment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error completing appointment {id}");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet]
        [Authorize]
        public async Task<ActionResult<IEnumerable<AppointmentDto>>> GetAllAppointments()
        {
            try
            {
                var appointments = await _appointmentService.GetAllAppointmentsAsync();
                return Ok(appointments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all appointments");
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("User")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<AppointmentDto>>> GetUserAppointments()
        {
            try
            {
                var userId = GetCurrentUserId();
                var appointments = await _appointmentService.GetUserAppointmentsAsync(userId);
                return Ok(appointments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user appointments");
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("Staff")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<AppointmentDto>>> GetStaffAppointments()
        {
            try
            {
                var userId = GetCurrentUserId();
                var staff = await _staffService.GetStaffByUserIdAsync(userId);
                if (staff == null)
                {
                    return BadRequest("User is not a staff member");
                }

                var appointments = await _appointmentService.GetStaffAppointmentsAsync(staff.StaffId);
                return Ok(appointments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting staff appointments");
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<AppointmentDto>> GetAppointment(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var appointment = await _appointmentService.GetAppointmentByIdAsync(id);

                if (appointment == null)
                {
                    return NotFound("Appointment not found");
                }                // Kiểm tra quyền truy cập
                // Since we're using [AllowAnonymous] for debugging, we need to check roles differently
                var user = await _context.Users.FindAsync(userId);
                var isAdmin = user?.Role == "Admin";
                var isStaff = user?.Role == "Staff";
                var isOwner = appointment.UserId == userId;

                bool isAssignedStaff = false;
                if (isStaff && appointment.StaffId.HasValue)
                {
                    var staff = await _staffService.GetStaffByUserIdAsync(userId);
                    isAssignedStaff = staff != null && staff.StaffId == appointment.StaffId.Value;
                }

                if (!isAdmin && !isStaff && !isOwner && !isAssignedStaff)
                {
                    return StatusCode(403, new { message = "You are not authorized to view this appointment" });
                }

                return Ok(appointment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting appointment {id}");
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPost]
        [Authorize]
        public async Task<ActionResult<AppointmentDto>> CreateAppointment(CreateAppointmentDto createAppointmentDto)
        {
            try
            {
                var userId = GetCurrentUserId();
                var isAdminOrStaff = User.IsInRole("Admin") || User.IsInRole("Staff");
                var createdAppointment = await _appointmentService.CreateAppointmentAsync(userId, createAppointmentDto, isAdminOrStaff);
                return CreatedAtAction(nameof(GetAppointment), new { id = createdAppointment.AppointmentId }, createdAppointment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating appointment");
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateAppointment(int id, UpdateAppointmentDto updateAppointmentDto)
        {
            try
            {
                var userId = GetCurrentUserId();
                var isStaff = User.IsInRole("Staff") || User.IsInRole("Admin");
                var existingAppointment = await _appointmentService.GetAppointmentByIdAsync(id);

                if (existingAppointment == null)
                {
                    return NotFound("Appointment not found");
                }                var isOwner = existingAppointment.UserId == userId;                if (!isStaff && !isOwner)
                {
                    return Forbid("You are not authorized to update this appointment");
                }

                // Regular users now have permission to change appointment status
                // No longer forcing status to "Scheduled" for non-staff users

                var updatedAppointment = await _appointmentService.UpdateAppointmentAsync(id, userId, updateAppointmentDto);

                if (updatedAppointment == null)
                {
                    return NotFound("Appointment not found");
                }

                return Ok(updatedAppointment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating appointment {id}");
                return BadRequest(ex.Message);
            }
        }

        [HttpPatch("{id}/Status")]
        [Authorize]
        public async Task<IActionResult> UpdateAppointmentStatus(int id, UpdateAppointmentStatusDto updateStatusDto)
        {
            try
            {
                var userId = GetCurrentUserId();
                var updatedAppointment = await _appointmentService.UpdateAppointmentStatusAsync(id, userId, updateStatusDto);

                if (updatedAppointment == null)
                {
                    return NotFound("Appointment not found");
                }

                return Ok(updatedAppointment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating appointment status {id}");
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> CancelAppointment(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _appointmentService.CancelAppointmentAsync(id, userId);

                if (!result)
                {
                    return NotFound(new { message = "Appointment not found" });
                }

                return Ok(new { message = "Appointment cancelled successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error cancelling appointment {id}");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}/reason")]
        [Authorize]
        public async Task<IActionResult> CancelAppointmentWithReason(int id, [FromBody] CancelReasonDto cancelReasonDto)
        {
            try
            {
                var userId = GetCurrentUserId();
                var result = await _appointmentService.CancelAppointmentAsync(id, userId, cancelReasonDto.Reason);

                if (!result)
                {
                    return NotFound(new { message = "Appointment not found" });
                }

                return Ok(new { message = "Appointment cancelled successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error cancelling appointment {id} with reason");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("cancel-count")]
        [Authorize]
        public async Task<IActionResult> GetCancelCountThisMonth()
        {
            try
            {
                var userId = GetCurrentUserId();
                var oneMonthAgo = DateTime.Now.AddMonths(-1);
                
                var cancelCount = await _context.Appointments
                    .Where(a => a.UserId == userId)
                    .Where(a => a.Status == "Cancelled")
                    .Where(a => a.CancelledAt.HasValue && a.CancelledAt.Value >= oneMonthAgo)
                    .CountAsync();

                return Ok(new { count = cancelCount });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting cancel count");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("available-staff")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<DTOs.Appointment.StaffAvailabilityDto>>> GetAvailableStaff(
            [FromQuery] DateTime date,
            [FromQuery] int serviceId)
        {
            try
            {
                // Lấy danh sách nhân viên có thể cung cấp dịch vụ này
                var staffWithService = await _context.StaffServices
                    .Where(ss => ss.ServiceId == serviceId)
                    .Include(ss => ss.Staff)
                        .ThenInclude(s => s.User)
                    .Select(ss => ss.Staff)
                    .ToListAsync();

                if (staffWithService.Count == 0)
                {
                    return Ok(new List<DTOs.Appointment.StaffAvailabilityDto>());
                }

                var result = new List<DTOs.Appointment.StaffAvailabilityDto>();

                foreach (var staff in staffWithService)
                {
                    // Kiểm tra lịch làm việc
                    var schedule = await _context.StaffSchedules
                        .FirstOrDefaultAsync(ss => ss.StaffId == staff.StaffId && ss.Date.Date == date.Date);

                    bool isWorking = schedule?.IsWorking ?? true; // Mặc định là làm việc nếu không có lịch cụ thể

                    if (!isWorking)
                    {
                        continue; // Bỏ qua nhân viên không làm việc trong ngày
                    }

                    // Đếm số lượng lịch hẹn trong ngày
                    var appointmentCount = await _context.Appointments
                        .CountAsync(a => a.StaffId == staff.StaffId &&
                                   a.AppointmentDate.Date == date.Date &&
                                   a.Status != "Cancelled" && a.Status != "No-Show");

                    result.Add(new DTOs.Appointment.StaffAvailabilityDto
                    {
                        StaffId = staff.StaffId,
                        StaffName = staff.User.FullName,
                        AppointmentCount = appointmentCount,
                        IsFullyBooked = false, // Có thể cần logic phức tạp hơn để xác định
                        IsWorking = isWorking
                    });
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting available staff for date {date}, serviceId {serviceId}");
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("staff-availability")]
        [AllowAnonymous]
        public async Task<ActionResult> CheckStaffAvailabilityForDate([FromQuery] int staffId, [FromQuery] DateTime date)
        {
            try
            {
                var staff = await _context.Staff
                    .Include(s => s.User)
                    .FirstOrDefaultAsync(s => s.StaffId == staffId);

                if (staff == null)
                    return NotFound("Nhân viên không tồn tại");

                // Kiểm tra xem nhân viên có lịch làm việc trong ngày đó không
                var staffSchedule = await _context.StaffSchedules
                    .FirstOrDefaultAsync(ss => ss.StaffId == staffId && ss.Date.Date == date.Date);

                bool isWorking = staffSchedule?.IsWorking ?? true; // Mặc định là làm việc nếu không có lịch cụ thể

                // Nếu có làm việc, kiểm tra xem đã có lịch hẹn trong ngày không
                var appointmentCount = await _context.Appointments
                    .CountAsync(a => a.StaffId == staffId && a.AppointmentDate.Date == date.Date &&
                              a.Status != "Cancelled" && a.Status != "No-Show");

                // Kiểm tra xem nhân viên có cung cấp những dịch vụ nào không
                var services = await _context.StaffServices
                    .Where(ss => ss.StaffId == staffId)
                    .Include(ss => ss.Service)
                    .Select(ss => new
                    {
                        ss.ServiceId,
                        ss.Service.Name,
                        ss.Service.Duration
                    })
                    .ToListAsync();

                return Ok(new
                {
                    staffId,
                    staffName = staff.User.FullName,
                    date = date.Date,
                    isWorking,
                    appointmentCount,
                    isFullyBooked = false, // Thực tế cần kiểm tra số lượng lịch hẹn so với khả năng tối đa
                    availableServices = services
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error checking staff availability for staffId {staffId} on date {date}");
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("staff-schedule")]
        [AllowAnonymous]
        public async Task<ActionResult> CheckStaffSchedule([FromQuery] int staffId, [FromQuery] DateTime date)
        {
            try
            {
                var staff = await _context.Staff
                    .Include(s => s.User)
                    .FirstOrDefaultAsync(s => s.StaffId == staffId);

                if (staff == null)
                    return Ok(new { isWorking = false, message = "Nhân viên không tồn tại" });

                // Kiểm tra xem nhân viên có lịch làm việc trong ngày đó không
                var staffSchedule = await _context.StaffSchedules
                    .FirstOrDefaultAsync(ss => ss.StaffId == staffId && ss.Date.Date == date.Date);

                bool isWorking = staffSchedule?.IsWorking ?? true; // Mặc định là làm việc nếu không có lịch cụ thể

                // Lấy các khung giờ làm việc
                var workingHours = new List<object>();
                if (isWorking)
                {
                    // Thêm khung giờ mặc định từ 8:00 - 21:30
                    workingHours.Add(new
                    {
                        start = "08:00",
                        end = "21:30"
                    });
                }

                // Lấy danh sách các lịch hẹn của nhân viên trong ngày
                var appointments = await _context.Appointments
                    .Include(a => a.Service)
                    .Where(a => a.StaffId == staffId && a.AppointmentDate.Date == date.Date)
                    .Where(a => a.Status != "Cancelled" && a.Status != "No-Show")
                    .Select(a => new
                    {
                        id = a.AppointmentId,
                        start = a.AppointmentDate.ToString("HH:mm"),
                        end = a.EndTime.HasValue ?
                              a.EndTime.Value.ToString("HH:mm") :
                              a.AppointmentDate.AddMinutes(a.Service != null ? a.Service.Duration : DEFAULT_SERVICE_DURATION_MINUTES).ToString("HH:mm"),
                        serviceName = a.Service.Name,
                        petId = a.PetId,
                        petName = a.Pet.Name,
                        status = a.Status
                    })
                    .ToListAsync();

                return Ok(new
                {
                    isWorking = isWorking,
                    staffId = staffId,
                    staffName = staff.User.FullName,
                    date = date.Date.ToString("yyyy-MM-dd"),
                    workingHours = workingHours,
                    appointments = appointments
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error in CheckStaffSchedule: {ex.Message}");

                // Luôn trả về JSON ngay cả khi có lỗi
                return StatusCode(500, new
                {
                    error = "Lỗi khi kiểm tra lịch nhân viên",
                    message = ex.Message
                });
            }
        }

        [HttpGet("check-availability")]
        [AllowAnonymous]
        public async Task<ActionResult> CheckTimeSlotAvailability(
     [FromQuery] string dateStr,
     [FromQuery] int serviceId,
     [FromQuery] int? staffId,
     [FromQuery] string petIdStr = null)
        {
            try
            {
                // Parse tham số một cách an toàn
                if (!DateTime.TryParse(dateStr, out DateTime date))
                {
                    return BadRequest(new { available = false, reason = "Định dạng ngày không hợp lệ" });
                }

                int? petId = null;
                if (!string.IsNullOrEmpty(petIdStr) && int.TryParse(petIdStr, out int parsedPetId))
                {
                    petId = parsedPetId;
                }

                // Kiểm tra thời gian trong giờ làm việc
                var service = await _context.Services.FindAsync(serviceId);
                if (service == null)
                    return NotFound(new { available = false, reason = "Không tìm thấy dịch vụ" });

                var endTime = date.AddMinutes(service.Duration);
                TimeSpan openingTime = new TimeSpan(8, 0, 0);
                TimeSpan closingTime = new TimeSpan(21, 30, 0);
                TimeSpan appointmentTimeOfDay = date.TimeOfDay;
                TimeSpan endTimeOfDay = endTime.TimeOfDay;

                if (appointmentTimeOfDay < openingTime || endTimeOfDay > closingTime)
                {
                    return BadRequest(new { available = false, reason = "Thời gian ngoài giờ làm việc (8:00 - 21:30)" });
                }                // Kiểm tra xem thời gian đã qua chưa
                // Cập nhật: Thêm buffer 30 phút
                var now = DateTime.Now;
                var bufferForBooking = TimeSpan.FromMinutes(BOOKING_BUFFER_MINUTES); // Buffer cho việc đặt lịch
                var cutoffTime = now.Add(bufferForBooking);

                // Chỉ kiểm tra các slot trong ngày hiện tại
                if (date.Date == now.Date && date <= cutoffTime)
                {
                    return BadRequest(new { available = false, reason = "Thời gian đã qua hoặc quá gần để đặt lịch" });
                }

                // Kiểm tra lịch của nhân viên nếu có chỉ định
                if (staffId.HasValue)
                {
                    // Kiểm tra nhân viên có tồn tại không
                    var staff = await _context.Staff.FindAsync(staffId.Value);
                    if (staff == null)
                    {
                        return NotFound(new { available = false, reason = "Nhân viên không tồn tại" });
                    }

                    // Kiểm tra nhân viên có lịch làm việc trong ngày không
                    var staffSchedule = await _context.StaffSchedules
                        .FirstOrDefaultAsync(ss => ss.StaffId == staffId.Value && ss.Date.Date == date.Date);

                    if (staffSchedule != null && !staffSchedule.IsWorking)
                    {
                        return Ok(new { available = false, reason = "Nhân viên không làm việc vào ngày này" });
                    }

                    // Kiểm tra xem nhân viên có chuyên môn về dịch vụ này không
                    var hasService = await _context.StaffServices
                        .AnyAsync(ss => ss.StaffId == staffId.Value && ss.ServiceId == serviceId);

                    if (!hasService)
                    {
                        return Ok(new { available = false, reason = "Nhân viên không cung cấp dịch vụ này" });
                    }
                }

                // Kiểm tra thú cưng có lịch hẹn trùng không
                if (petId.HasValue)
                {
                    try
                    {
                        var petBusySlots = await GetPetBusyTimeSlotsInternal(petId.Value, date.Date);
                        var requestedTimeString = date.ToString("HH:mm");

                        if (petBusySlots.Contains(requestedTimeString))
                        {
                            return Ok(new
                            {
                                available = false,
                                reason = "Thú cưng đã có lịch hẹn vào khung giờ này",
                                petId = petId.Value,
                                petBusySlots = petBusySlots
                            });
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Lỗi khi kiểm tra lịch bận của pet {petId}: {ex.Message}");
                        // Tiếp tục thực thi ngay cả khi có lỗi, không return ở đây
                    }
                }

                // Kiểm tra xem thời gian này đã có lịch hẹn chưa
                bool isAvailable = false;
                try
                {
                    isAvailable = await _appointmentService.IsTimeSlotAvailableAsync(date, serviceId, staffId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi khi kiểm tra khả dụng của khung giờ");
                    // Mặc định là có khả dụng nếu có lỗi
                    isAvailable = true;
                }

                if (!isAvailable)
                {
                    return Ok(new { available = false, reason = "Khung giờ này đã được đặt" });
                }

                // Nếu mọi kiểm tra đều thành công, trả về kết quả khả dụng
                return Ok(new
                {
                    available = true,
                    serviceId = serviceId,
                    serviceName = service.Name,
                    serviceDuration = service.Duration,
                    date = date.ToString("o"),
                    staffId = staffId,
                    petId = petId
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in CheckTimeSlotAvailability");
                return StatusCode(500, new { available = false, error = ex.Message });
            }
        }

        [HttpGet("Pet/{id}/busy-slots/range")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<BusyDateDto>>> GetPetBusyTimeSlotsRange(
            int id, [FromQuery] DateTime startDate, [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var actualEndDate = endDate ?? startDate.AddDays(6);
                var result = new List<BusyDateDto>();

                for (var date = startDate.Date; date <= actualEndDate.Date; date = date.AddDays(1))
                {
                    var busySlots = await GetPetBusyTimeSlotsInternal(id, date);

                    if (busySlots.Any())
                    {
                        result.Add(new BusyDateDto
                        {
                            Date = date,
                            BusySlots = busySlots,                            BusyTimeSlots = busySlots.Select(s => new BusyTimeSlotDto
                            {
                                StartTime = s,
                                EndTime = DateTime.Parse($"{date:yyyy-MM-dd} {s}").AddMinutes(DEFAULT_SLOT_INTERVAL_MINUTES).ToString("HH:mm")
                            }).ToList()
                        });
                    }
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting busy slots range for pet {id}");
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPost("check-conflicts")]
        [Authorize]
        public async Task<ActionResult> CheckAppointmentConflicts(
            [FromBody] CheckConflictDto checkDto)
        {
            try
            {
                var conflicts = new List<object>();

                // Kiểm tra xung đột với lịch của nhân viên
                if (checkDto.StaffId.HasValue)
                {
                    var staffConflicts = await _appointmentService.CheckStaffConflicts(
                        checkDto.StaffId.Value, checkDto.Date, checkDto.Duration);
                    conflicts.AddRange(staffConflicts);
                }

                // Kiểm tra xung đột với lịch của thú cưng
                if (checkDto.PetId.HasValue)
                {
                    var petConflicts = await _appointmentService.CheckPetConflicts(
                        checkDto.PetId.Value, checkDto.Date);
                    conflicts.AddRange(petConflicts);
                }

                return Ok(new
                {
                    hasConflicts = conflicts.Count > 0,
                    conflicts = conflicts
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in CheckAppointmentConflicts");
                return StatusCode(500, new { message = ex.Message });
            }
        }

        private IList<DTOs.Appointment.TimeSlotDto> GenerateDefaultSlots(DateTime date, int serviceDuration)
        {
            var defaultSlots = new List<DTOs.Appointment.TimeSlotDto>();        // Tạo các slot dựa trên thời lượng dịch vụ thực tế + buffer thay vì slot cố định 30 phút
            DateTime startTime = date.Date.AddHours(8); // 8:00 AM
            DateTime endBusinessHours = date.Date.AddHours(21).AddMinutes(30); // 9:30 PM
            
            // Kiểm tra thời lượng dịch vụ, nếu không có thì báo lỗi
            if (serviceDuration <= 0)
            {
                throw new ArgumentException("Không thể tạo khung giờ: Thời lượng dịch vụ không hợp lệ hoặc không tìm thấy thông tin dịch vụ.");
            }
            
            // Tính thời gian thực tế cho mỗi slot: thời lượng dịch vụ + buffer
            int slotInterval = serviceDuration + BUFFER_TIME_MINUTES; // Thời lượng dịch vụ + 10 phút buffer
            int bufferTime = BUFFER_TIME_MINUTES; // Thời gian đệm giữa các cuộc hẹn

            int slotCounter = 1;
            while (startTime < endBusinessHours)
            {
                DateTime endTime = startTime.AddMinutes(serviceDuration);
                DateTime bufferEndTime = endTime.AddMinutes(bufferTime);

                // Kiểm tra nếu slot kết thúc (bao gồm buffer) vẫn trong giờ làm việc
                if (bufferEndTime <= endBusinessHours)
                {
                    var slot = new DTOs.Appointment.TimeSlotDto
                    {
                        Id = $"slot_{date:yyyyMMdd}_{slotCounter++}",
                        StartTime = startTime,
                        EndTime = endTime,
                        BufferEndTime = bufferEndTime,
                        Available = true,
                        IsAvailable = true,
                        IsPast = startTime <= DateTime.Now,
                        IsPastTime = startTime <= DateTime.Now,
                        Duration = serviceDuration,
                        BufferTime = bufferTime,
                        IsDefault = true,
                        IsWithinWorkingHours = true,
                        // KHÔNG gán TimeDisplayString ở đây - nó sẽ tự động tính toán
                        SelectedDate = date.ToString("yyyy-MM-dd")
                    };

                    // Nếu slot đã qua, đánh dấu là không khả dụng
                    // Cập nhật: Thêm buffer 30 phút cho việc đặt lịch
                    var now = DateTime.Now;
                    var bufferForBooking = TimeSpan.FromMinutes(BOOKING_BUFFER_MINUTES); // Buffer cho việc đặt lịch
                    var cutoffTime = now.Add(bufferForBooking);

                    // Chỉ kiểm tra các slot trong ngày hiện tại
                    if (date.Date == now.Date && slot.StartTime <= cutoffTime)
                    {
                        slot.Available = false;
                        slot.IsAvailable = false;
                        slot.IsPast = true;
                        slot.IsPastTime = true;
                        slot.UnavailableReason = "Khung giờ đã qua hoặc quá gần để đặt lịch";
                    }

                    defaultSlots.Add(slot);
                }

                // Tính thời gian bắt đầu của slot tiếp theo (bắt đầu sau khi slot hiện tại kết thúc + buffer)
                startTime = startTime.AddMinutes(slotInterval);
            }

            return defaultSlots;
        }        private int GetCurrentUserId()
        {
            if (!User.Identity.IsAuthenticated)
            {
                throw new UnauthorizedAccessException("User must be authenticated to perform this action");
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                throw new UnauthorizedAccessException("User ID not found in token");
            }

            return int.Parse(userIdClaim.Value);
        }
    }
}
