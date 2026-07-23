using BE_PetWeb_API.Extensions;
using BE_PetWeb_API.Middleware;
using BE_PetWeb_API.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Cấu hình logging chi tiết hơn
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();
builder.Logging.SetMinimumLevel(LogLevel.Information);

// Add services to the container.
// Cập nhật phần này để đảm bảo serialization các thuộc tính read-only
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Cấu hình JsonSerializer để đảm bảo các thuộc tính chỉ đọc được serialized
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.WriteIndented = true;
        options.JsonSerializerOptions.IncludeFields = true;

        // Cho phép System.Text.Json serialize các thuộc tính chỉ đọc
        options.JsonSerializerOptions.IgnoreReadOnlyProperties = false;

        // Nếu cần deserialize từ camelCase sang PascalCase và ngược lại
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

// Lấy Connection String
var connectionString = builder.Configuration.GetConnectionString("PetWebConnection");

// Tự động chuyển đổi định dạng URI (của Neon/Render) sang định dạng chuẩn của Npgsql
if (!string.IsNullOrEmpty(connectionString) && (connectionString.StartsWith("postgres://") || connectionString.StartsWith("postgresql://")))
{
    var uri = new Uri(connectionString);
    var userInfo = uri.UserInfo.Split(':');
    var password = userInfo.Length > 1 ? userInfo[1] : "";
    
    connectionString = $"Host={uri.Host};Port={(uri.Port > 0 ? uri.Port : 5432)};Database={uri.LocalPath.TrimStart('/')};Username={userInfo[0]};Password={password};SSL Mode=Require;Trust Server Certificate=true;";
}

// Add DbContext
builder.Services.AddDbContext<PetWebContext>(options =>
    options.UseNpgsql(connectionString));

// Add HttpClient for OneSignal and other services
builder.Services.AddHttpClient();

// Register all application services using the extension method
builder.Services.RegisterServices();

// Add SignalR with enhanced configuration
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = builder.Environment.IsDevelopment(); // Only in dev
});

// Add Health Checks
builder.Services.AddHealthChecks()
    .AddDbContextCheck<PetWebContext>("database");

// Tăng kích thước tối đa của request để hỗ trợ file lớn
builder.Services.Configure<IISServerOptions>(options =>
{
    options.MaxRequestBodySize = 30 * 1024 * 1024; // 30 MB
});

builder.Services.Configure<KestrelServerOptions>(options =>
{
    options.Limits.MaxRequestBodySize = 30 * 1024 * 1024; // 30 MB
});

builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 30 * 1024 * 1024; // 30 MB
    options.ValueLengthLimit = 30 * 1024 * 1024; // 30 MB
});

// Add JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["JWT:Issuer"],
            ValidAudience = builder.Configuration["JWT:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["JWT:Key"]))
        };
        
        // Allow SignalR connections with token from query string
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/slotHub"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

// Add CORS - cho phép tất cả origins (đồ án demo)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigins",
        policy => policy
            .SetIsOriginAllowed(_ => true) // Cho phép mọi origin (portfolio demo)
            .AllowAnyMethod()
            .AllowAnyHeader()
            .WithExposedHeaders("Content-Disposition")
            .AllowCredentials()); // Required for SignalR
});

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Pet Web API",
        Version = "v1",
        Description = "API for Pet Web Application"
    });
    // Add JWT Authentication to Swagger
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

// Configure Kestrel
if (!builder.Environment.IsDevelopment())
{
    // Khi chạy qua IIS, IIS sẽ tự quản lý port
    // Khi chạy standalone (self-host), dùng port 5000/5001
    var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
}

var app = builder.Build();

try
{
    // Đảm bảo thư mục uploads tồn tại
    var uploadsPath = Path.Combine(app.Environment.WebRootPath, "uploads");
    if (!Directory.Exists(uploadsPath))
    {
        Directory.CreateDirectory(uploadsPath);
        app.Logger.LogInformation($"Created directory: {uploadsPath}");
    }

    var petsPath = Path.Combine(uploadsPath, "pets");
    if (!Directory.Exists(petsPath))
    {
        Directory.CreateDirectory(petsPath);
        app.Logger.LogInformation($"Created directory: {petsPath}");
    }

    var avatarsPath = Path.Combine(uploadsPath, "avatars");
    if (!Directory.Exists(avatarsPath))
    {
        Directory.CreateDirectory(avatarsPath);
        app.Logger.LogInformation($"Created directory: {avatarsPath}");
    }

    // Thêm thư mục products
    var productsPath = Path.Combine(uploadsPath, "products");
    if (!Directory.Exists(productsPath))
    {
        Directory.CreateDirectory(productsPath);
        app.Logger.LogInformation($"Created directory: {productsPath}");
    }

    // Thêm thư mục services
    var servicesPath = Path.Combine(uploadsPath, "services");
    if (!Directory.Exists(servicesPath))
    {
        Directory.CreateDirectory(servicesPath);
        app.Logger.LogInformation($"Created directory: {servicesPath}");
    }

    // Thêm thư mục reviews
    var reviewsPath = Path.Combine(uploadsPath, "reviews");
    if (!Directory.Exists(reviewsPath))
    {
        Directory.CreateDirectory(reviewsPath);
        app.Logger.LogInformation($"Created directory: {reviewsPath}");
    }
}
catch (Exception ex)
{
    // Log lỗi nhưng không làm crash ứng dụng
    app.Logger.LogError(ex, "Error creating uploads directories");
}

// Global Exception Handling Middleware
app.UseExceptionHandlingMiddleware();

// Swagger - available in all environments for portfolio demo
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Pet Web API v1");
    c.RoutePrefix = "swagger";
});

// HTTPS Redirection for production
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// Thêm middleware xử lý CORS cho StaticFiles
app.Use(async (context, next) =>
{
    // Thêm header CORS cho các request tới uploads
    if (context.Request.Path.StartsWithSegments("/uploads"))
    {
        context.Response.Headers.Append("Access-Control-Allow-Origin", "*");
        context.Response.Headers.Append("Access-Control-Allow-Methods", "GET");
        context.Response.Headers.Append("Access-Control-Allow-Headers", "Content-Type");

        // Nếu là OPTIONS request (preflight), trả về ngay
        if (context.Request.Method == "OPTIONS")
        {
            context.Response.StatusCode = 200;
            return;
        }
    }

    await next();
});

// Serve static files from wwwroot folder (for images, uploads, and React SPA)
app.UseDefaultFiles(); // Serves index.html by default
app.UseStaticFiles();

// CORS policy
app.UseCors("AllowSpecificOrigins");

// Add Authentication middleware
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Map SignalR Hub with CORS
app.MapHub<BE_PetWeb_API.Hubs.TimeSlotSharingHub>("/timeSlotHub").RequireCors("AllowSpecificOrigins");

// Health check endpoint
app.MapHealthChecks("/api/health");

// SPA fallback - serve index.html for any non-API, non-file routes (React Router)
app.MapFallbackToFile("index.html");

// Tự động tạo tài khoản Admin và Auto-Migrate Database
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<PetWebContext>();
        
        // Tự động apply các migrations (Tạo bảng trong database mới như Neon)
        context.Database.Migrate();

        // Kiểm tra xem đã có admin nào chưa
        if (!context.Users.Any(u => u.Role == "Admin"))
        {
            // Mã hóa mật khẩu
            using var hmac = new System.Security.Cryptography.HMACSHA256();
            var passwordHash = hmac.ComputeHash(System.Text.Encoding.UTF8.GetBytes("admin123"));
            string hashedPassword = Convert.ToBase64String(passwordHash) + ":" + Convert.ToBase64String(hmac.Key);

            var admin = new User
            {
                Username = "admin",
                Email = "admin@petservice.com",
                Password = hashedPassword,
                FullName = "Administrator",
                Phone = "0123456789",
                Address = "Việt Nam",
                Avatar = "default-avatar.png",
                Role = "Admin",
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now,
                IsActive = true
            };
            
            context.Users.Add(admin);
            context.SaveChanges();
            app.Logger.LogInformation("Đã tự động tạo tài khoản Admin (admin/admin123) thành công!");
        }
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Đã xảy ra lỗi khi tạo tài khoản Admin tự động.");
    }
}

app.Run();