using BE_PetWeb_API.Services.Interfaces;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.IO;
using System.Threading.Tasks;

namespace BE_PetWeb_API.Services.Implementations
{
    public class FileService : IFileService
    {
        private readonly Cloudinary _cloudinary;
        private readonly ILogger<FileService> _logger;

        public FileService(IConfiguration config, ILogger<FileService> logger)
        {
            _logger = logger;
            
            var account = new Account(
                config["Cloudinary:CloudName"],
                config["Cloudinary:ApiKey"],
                config["Cloudinary:ApiSecret"]
            );
            _cloudinary = new Cloudinary(account);
            _cloudinary.Api.Secure = true;
        }

        public async Task<string> UploadImageAsync(IFormFile file, string folderName)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    _logger.LogWarning("Empty file received for upload");
                    return null;
                }

                var fileExtension = Path.GetExtension(file.FileName).ToLower();
                if (string.IsNullOrEmpty(fileExtension) || !IsValidImageExtension(fileExtension))
                {
                    _logger.LogWarning($"Invalid file extension: {fileExtension}");
                    throw new Exception("Invalid file extension. Only jpg, jpeg, png, and gif are allowed.");
                }

                using var stream = file.OpenReadStream();
                var uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(file.FileName, stream),
                    Folder = $"pet_service/{folderName}", // Group under pet_service in Cloudinary
                    Transformation = new Transformation().Quality("auto").FetchFormat("auto")
                };

                var uploadResult = await _cloudinary.UploadAsync(uploadParams);

                if (uploadResult.Error != null)
                {
                    _logger.LogError($"Cloudinary upload error: {uploadResult.Error.Message}");
                    throw new Exception(uploadResult.Error.Message);
                }

                _logger.LogInformation($"File uploaded successfully to Cloudinary. URL: {uploadResult.SecureUrl}");
                return uploadResult.SecureUrl.ToString();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error uploading image to Cloudinary: {ex.Message}");
                throw new Exception($"Failed to upload image: {ex.Message}", ex);
            }
        }

        public bool DeleteImage(string imagePath)
        {
            if (string.IsNullOrEmpty(imagePath)) return false;

            try
            {
                // Mẫu URL Cloudinary: https://res.cloudinary.com/cloud_name/image/upload/v1234567/folder/filename.jpg
                if (imagePath.Contains("cloudinary.com"))
                {
                    var parts = imagePath.Split(new[] { "/upload/" }, StringSplitOptions.None);
                    if (parts.Length > 1)
                    {
                        var pathAfterUpload = parts[1];
                        
                        // Bỏ qua phần version (vd: v123456/)
                        var firstSlashIndex = pathAfterUpload.IndexOf('/');
                        if (firstSlashIndex != -1 && pathAfterUpload.StartsWith("v"))
                        {
                            pathAfterUpload = pathAfterUpload.Substring(firstSlashIndex + 1);
                        }

                        // Public ID không bao gồm phần mở rộng (đuôi file)
                        var publicId = Path.ChangeExtension(pathAfterUpload, null);
                        
                        var deletionParams = new DeletionParams(publicId);
                        var result = _cloudinary.Destroy(deletionParams);

                        _logger.LogInformation($"Cloudinary delete result for {publicId}: {result.Result}");
                        return result.Result == "ok";
                    }
                }
                
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting image {imagePath}: {ex.Message}");
                return false;
            }
        }

        private bool IsValidImageExtension(string extension)
        {
            var validExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
            return Array.Exists(validExtensions, ext => ext.Equals(extension, StringComparison.OrdinalIgnoreCase));
        }
    }
}