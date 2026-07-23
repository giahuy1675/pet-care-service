# Sử dụng image ASP.NET 8 runtime làm base
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app

# Sử dụng SDK 8.0 để build code
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copy file .csproj và restore dependencies
COPY ["BE_PetWeb_API/BE_PetWeb_API.csproj", "BE_PetWeb_API/"]
RUN dotnet restore "./BE_PetWeb_API/BE_PetWeb_API.csproj"

# Copy toàn bộ source code và build
COPY . .
WORKDIR "/src/BE_PetWeb_API"
RUN dotnet build "./BE_PetWeb_API.csproj" -c $BUILD_CONFIGURATION -o /app/build

# Publish ứng dụng
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./BE_PetWeb_API.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# Chạy ứng dụng từ image base
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Koyeb sẽ tự động truyền biến môi trường PORT, app của bạn đã cấu hình lấy PORT này trong Program.cs
ENTRYPOINT ["dotnet", "BE_PetWeb_API.dll"]
