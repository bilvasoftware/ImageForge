using Microsoft.AspNetCore.Mvc;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;

namespace ImageForge.Controllers
{
    public class CropperController : Controller
    {
        [HttpGet]
        public IActionResult Index()
        {
            return View();
        }

        [HttpPost]
        [RequestSizeLimit(50 * 1024 * 1024)]
        public async Task<IActionResult> Crop(
    IFormFile file,
    int x,
    int y,
    int width,
    int height,
    string outputFormat = "webp",
    int quality = 85)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("Please select an image.");
            }

            var allowedTypes = new[]
            {
        "image/jpeg",
        "image/png",
        "image/webp"
    };

            if (!allowedTypes.Contains(
                file.ContentType?.ToLowerInvariant()))
            {
                return BadRequest(
                    "Only JPG, PNG, and WEBP images are supported.");
            }

            if (x < 0 || y < 0 || width <= 0 || height <= 0)
            {
                return BadRequest("Invalid crop dimensions.");
            }

            quality = Math.Clamp(quality, 1, 100);

            outputFormat = outputFormat?.ToLowerInvariant() switch
            {
                "jpg" => "jpg",
                "jpeg" => "jpg",
                "png" => "png",
                "webp" => "webp",
                _ => "webp"
            };

            try
            {
                await using var inputStream = file.OpenReadStream();

                using var image = await Image.LoadAsync(inputStream);

                // Validate crop against the actual source image.
                if (x >= image.Width || y >= image.Height)
                {
                    return BadRequest(
                        "The selected crop area is outside the image.");
                }

                width = Math.Min(width, image.Width - x);
                height = Math.Min(height, image.Height - y);

                if (width <= 0 || height <= 0)
                {
                    return BadRequest(
                        "The selected crop area is invalid.");
                }

                var originalWidth = image.Width;
                var originalHeight = image.Height;
                var originalSize = file.Length;

                // Perform the actual crop.
                image.Mutate(context =>
                {
                    context.Crop(
                        new Rectangle(
                            x,
                            y,
                            width,
                            height
                        )
                    );
                });

                await using var outputStream = new MemoryStream();

                string contentType;
                string extension;

                switch (outputFormat)
                {
                    case "jpg":
                        {
                            contentType = "image/jpeg";
                            extension = "jpg";

                            var encoder = new JpegEncoder
                            {
                                Quality = quality
                            };

                            await image.SaveAsJpegAsync(
                                outputStream,
                                encoder
                            );

                            break;
                        }

                    case "png":
                        {
                            contentType = "image/png";
                            extension = "png";

                            var encoder = new PngEncoder();

                            await image.SaveAsPngAsync(
                                outputStream,
                                encoder
                            );

                            break;
                        }

                    default:
                        {
                            contentType = "image/webp";
                            extension = "webp";

                            var encoder = new WebpEncoder
                            {
                                Quality = quality
                            };

                            await image.SaveAsWebpAsync(
                                outputStream,
                                encoder
                            );

                            break;
                        }
                }

                var data = outputStream.ToArray();

                var originalName =
                    Path.GetFileNameWithoutExtension(file.FileName);

                var fileName =
                    $"{originalName}-cropped.{extension}";

                return Json(new
                {
                    success = true,

                    fileName,

                    contentType,

                    data = Convert.ToBase64String(data),

                    originalWidth,
                    originalHeight,

                    // Names expected by cropper.js
                    width,
                    height,

                    originalSize,

                    // Names expected by cropper.js
                    fileSize = data.LongLength,

                    originalFormat =
    GetFormatName(file.ContentType ?? string.Empty),

                    outputFormat =
                        outputFormat.ToUpperInvariant()
                });
            }
            catch (UnknownImageFormatException)
            {
                return BadRequest(
                    "The selected file is not a valid image.");
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    $"Cropping failed: {ex.Message}");
            }
        }


        private static string GetFormatName(
            string contentType)
        {
            return contentType.ToLowerInvariant() switch
            {
                "image/jpeg" => "JPG",
                "image/png" => "PNG",
                "image/webp" => "WEBP",
                _ => "IMAGE"
            };
        }
    }
}