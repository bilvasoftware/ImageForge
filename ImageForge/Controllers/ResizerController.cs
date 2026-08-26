using Microsoft.AspNetCore.Mvc;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;

namespace ImageForge.Controllers
{
    public class ResizerController : Controller
    {
        private const int MaxFiles = 20;
        private const long MaxFileSize = 50 * 1024 * 1024; // 50 MB per image

        [HttpGet]
        public IActionResult Index()
        {
            return View();
        }

        [HttpPost]
        [RequestSizeLimit(1024L * 1024L * 1024L)]
        public async Task<IActionResult> Resize(
            List<IFormFile> files,
            string resizeMode,
            int? width,
            int? height,
            int? percentage,
            bool keepAspectRatio,
            string outputFormat = "original",
            int quality = 85)
        {
            if (files == null || files.Count == 0)
            {
                return BadRequest("Please select at least one image.");
            }

            if (files.Count > MaxFiles)
            {
                return BadRequest($"You can resize a maximum of {MaxFiles} images.");
            }

            resizeMode = (resizeMode ?? "dimensions").ToLowerInvariant();
            outputFormat = (outputFormat ?? "original").ToLowerInvariant();

            quality = Math.Clamp(quality, 1, 100);

            if (resizeMode != "dimensions" && resizeMode != "percentage")
            {
                return BadRequest("Invalid resize mode.");
            }

            if (resizeMode == "dimensions")
            {
                if (!width.HasValue || width.Value < 1)
                {
                    return BadRequest("Please enter a valid width.");
                }

                if (!height.HasValue || height.Value < 1)
                {
                    return BadRequest("Please enter a valid height.");
                }

                if (width.Value > 10000 || height.Value > 10000)
                {
                    return BadRequest("Maximum resize dimension is 10,000 pixels.");
                }
            }

            if (resizeMode == "percentage")
            {
                if (!percentage.HasValue || percentage.Value < 1)
                {
                    return BadRequest("Please enter a valid percentage.");
                }

                if (percentage.Value > 500)
                {
                    return BadRequest("Maximum resize percentage is 500%.");
                }
            }

            var results = new List<ResizeResult>();

            foreach (var file in files)
            {
                if (file == null || file.Length == 0)
                {
                    continue;
                }

                if (file.Length > MaxFileSize)
                {
                    return BadRequest(
                        $"The file '{file.FileName}' exceeds the 50 MB limit."
                    );
                }

                if (!IsSupportedImage(file))
                {
                    return BadRequest(
                        $"The file '{file.FileName}' is not a supported image. Use JPG, PNG, or WEBP."
                    );
                }

                try
                {
                    await using var inputStream = file.OpenReadStream();

                    using var image = await Image.LoadAsync(inputStream);

                    int originalWidth = image.Width;
                    int originalHeight = image.Height;

                    int targetWidth;
                    int targetHeight;

                    if (resizeMode == "percentage")
                    {
                        double scale =
                            percentage!.Value / 100.0;

                        targetWidth = Math.Max(
                            1,
                            (int)Math.Round(
                                originalWidth * scale
                            )
                        );

                        targetHeight = Math.Max(
                            1,
                            (int)Math.Round(
                                originalHeight * scale
                            )
                        );
                    }
                    else
                    {
                        targetWidth = width!.Value;
                        targetHeight = height!.Value;

                        if (keepAspectRatio)
                        {
                            var ratioX =
                                (double)targetWidth /
                                originalWidth;

                            var ratioY =
                                (double)targetHeight /
                                originalHeight;

                            var ratio =
                                Math.Min(
                                    ratioX,
                                    ratioY
                                );

                            targetWidth = Math.Max(
                                1,
                                (int)Math.Round(
                                    originalWidth * ratio
                                )
                            );

                            targetHeight = Math.Max(
                                1,
                                (int)Math.Round(
                                    originalHeight * ratio
                                )
                            );
                        }
                    }

                    image.Mutate(
                        context =>
                        {
                            context.Resize(
                                new ResizeOptions
                                {
                                    Size = new Size(
                                        targetWidth,
                                        targetHeight
                                    ),
                                    Mode = ResizeMode.Stretch
                                }
                            );
                        }
                    );

                    string originalFormat =
                        GetImageFormat(file.FileName);

                    string finalFormat =
                        outputFormat == "original"
                            ? originalFormat
                            : outputFormat;

                    if (
                        finalFormat != "jpg" &&
                        finalFormat != "png" &&
                        finalFormat != "webp"
                    )
                    {
                        finalFormat = "webp";
                    }

                    using var outputStream =
                        new MemoryStream();

                    switch (finalFormat)
                    {
                        case "jpg":

                            await image.SaveAsJpegAsync(
                                outputStream,
                                new JpegEncoder
                                {
                                    Quality = quality
                                }
                            );

                            break;

                        case "png":

                            await image.SaveAsPngAsync(
                                outputStream,
                                new PngEncoder()
                            );

                            break;

                        case "webp":

                            await image.SaveAsWebpAsync(
                                outputStream,
                                new WebpEncoder
                                {
                                    Quality = quality
                                }
                            );

                            break;

                        default:

                            await image.SaveAsWebpAsync(
                                outputStream,
                                new WebpEncoder
                                {
                                    Quality = quality
                                }
                            );

                            finalFormat = "webp";

                            break;
                    }

                    var outputBytes =
                        outputStream.ToArray();

                    string contentType =
                        GetContentType(finalFormat);

                    string outputFileName =
                        BuildOutputFileName(
                            file.FileName,
                            finalFormat
                        );

                    results.Add(
                        new ResizeResult
                        {
                            FileName = outputFileName,
                            OriginalFileName = file.FileName,

                            OriginalFormat =
                                originalFormat.ToUpperInvariant(),

                            ResizedFormat =
                                finalFormat.ToUpperInvariant(),

                            OriginalSize =
                                file.Length,

                            ResizedSize =
                                outputBytes.Length,

                            OriginalWidth =
                                originalWidth,

                            OriginalHeight =
                                originalHeight,

                            ResizedWidth =
                                targetWidth,

                            ResizedHeight =
                                targetHeight,

                            ContentType =
                                contentType,

                            Data =
                                Convert.ToBase64String(
                                    outputBytes
                                )
                        }
                    );
                }
                catch (UnknownImageFormatException)
                {
                    return BadRequest(
                        $"The file '{file.FileName}' could not be read as an image."
                    );
                }
                catch (Exception ex)
                {
                    return BadRequest(
                        $"Unable to resize '{file.FileName}': {ex.Message}"
                    );
                }
            }

            if (results.Count == 0)
            {
                return BadRequest(
                    "No valid images were processed."
                );
            }

            return Json(results);
        }

        private static bool IsSupportedImage(
            IFormFile file)
        {
            string extension =
                Path.GetExtension(
                    file.FileName
                ).ToLowerInvariant();

            return
                extension == ".jpg" ||
                extension == ".jpeg" ||
                extension == ".png" ||
                extension == ".webp";
        }

        private static string GetImageFormat(
            string fileName)
        {
            string extension =
                Path.GetExtension(
                    fileName
                ).ToLowerInvariant();

            return extension switch
            {
                ".jpg" => "jpg",
                ".jpeg" => "jpg",
                ".png" => "png",
                ".webp" => "webp",
                _ => "webp"
            };
        }

        private static string GetContentType(
            string format)
        {
            return format switch
            {
                "jpg" => "image/jpeg",
                "png" => "image/png",
                "webp" => "image/webp",
                _ => "application/octet-stream"
            };
        }

        private static string BuildOutputFileName(
            string originalFileName,
            string format)
        {
            string name =
                Path.GetFileNameWithoutExtension(
                    originalFileName
                );

            string extension =
                format switch
                {
                    "jpg" => ".jpg",
                    "png" => ".png",
                    "webp" => ".webp",
                    _ => ".webp"
                };

            return $"{name}-resized{extension}";
        }

        public class ResizeResult
        {
            public string FileName { get; set; } = "";

            public string OriginalFileName { get; set; } = "";

            public string OriginalFormat { get; set; } = "";

            public string ResizedFormat { get; set; } = "";

            public long OriginalSize { get; set; }

            public long ResizedSize { get; set; }

            public int OriginalWidth { get; set; }

            public int OriginalHeight { get; set; }

            public int ResizedWidth { get; set; }

            public int ResizedHeight { get; set; }

            public string ContentType { get; set; } = "";

            public string Data { get; set; } = "";
        }
    }
}