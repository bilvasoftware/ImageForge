using Microsoft.AspNetCore.Mvc;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;

namespace ImageForge.Controllers
{
    public class WatermarkController : Controller
    {
        // =========================================================
        // WATERMARK PAGE
        // GET: /Watermark
        // =========================================================

        [HttpGet]
        public IActionResult Index()
        {
            return View();
        }


        // =========================================================
        // APPLY WATERMARK
        // POST: /Watermark/Apply
        // =========================================================

        [HttpPost]
        [RequestSizeLimit(50_000_000)]
        public async Task<IActionResult> Apply(
            IFormFile image,
            IFormFile watermark,
            string position = "center",
            int opacity = 50,
            int scale = 25,
            int margin = 20,
            string outputFormat = "png")
        {
            try
            {
                // =====================================================
                // VALIDATE MAIN IMAGE
                // =====================================================

                if (image == null || image.Length == 0)
                {
                    return BadRequest(new
                    {
                        message = "Please upload an image."
                    });
                }


                // =====================================================
                // VALIDATE WATERMARK
                // =====================================================

                if (watermark == null || watermark.Length == 0)
                {
                    return BadRequest(new
                    {
                        message = "Please upload a watermark image."
                    });
                }


                // =====================================================
                // ALLOWED FILE TYPES
                // =====================================================

                var allowedTypes = new[]
                {
                    "image/jpeg",
                    "image/png",
                    "image/webp"
                };


                string imageContentType =
                    image.ContentType?.ToLowerInvariant() ?? "";


                string watermarkContentType =
                    watermark.ContentType?.ToLowerInvariant() ?? "";


                if (!allowedTypes.Contains(imageContentType))
                {
                    return BadRequest(new
                    {
                        message =
                            "The main image must be JPG, PNG, or WEBP."
                    });
                }


                if (!allowedTypes.Contains(watermarkContentType))
                {
                    return BadRequest(new
                    {
                        message =
                            "The watermark must be JPG, PNG, or WEBP."
                    });
                }


                // =====================================================
                // VALIDATE SETTINGS
                // =====================================================

                opacity = Math.Clamp(opacity, 0, 100);

                scale = Math.Clamp(scale, 1, 100);

                margin = Math.Clamp(margin, 0, 1000);


                var validPositions = new[]
                {
                    "top-left",
                    "top-center",
                    "top-right",

                    "center-left",
                    "center",
                    "center-right",

                    "bottom-left",
                    "bottom-center",
                    "bottom-right"
                };


                if (!validPositions.Contains(position))
                {
                    position = "center";
                }


                outputFormat =
                    (outputFormat ?? "png").ToLowerInvariant();


                if (
                    outputFormat != "png" &&
                    outputFormat != "jpg" &&
                    outputFormat != "jpeg" &&
                    outputFormat != "webp"
                )
                {
                    outputFormat = "png";
                }


                // =====================================================
                // LOAD IMAGES
                // =====================================================

                using var imageStream =
                    image.OpenReadStream();

                using var watermarkStream =
                    watermark.OpenReadStream();


                using var sourceImage =
                    await Image.LoadAsync(imageStream);


                using var watermarkImage =
                    await Image.LoadAsync(watermarkStream);


                // =====================================================
                // CALCULATE WATERMARK SIZE
                // =====================================================

                int targetWatermarkWidth =
                    (int)(
                        sourceImage.Width *
                        (scale / 100.0)
                    );


                targetWatermarkWidth =
                    Math.Max(
                        1,
                        targetWatermarkWidth
                    );


                double watermarkRatio =
                    (double)watermarkImage.Height /
                    watermarkImage.Width;


                int targetWatermarkHeight =
                    (int)(
                        targetWatermarkWidth *
                        watermarkRatio
                    );


                targetWatermarkHeight =
                    Math.Max(
                        1,
                        targetWatermarkHeight
                    );


                // =====================================================
                // DO NOT LET WATERMARK EXCEED SOURCE IMAGE
                // =====================================================

                if (
                    targetWatermarkWidth >
                    sourceImage.Width
                )
                {
                    targetWatermarkWidth =
                        sourceImage.Width;
                }


                if (
                    targetWatermarkHeight >
                    sourceImage.Height
                )
                {
                    targetWatermarkHeight =
                        sourceImage.Height;
                }


                // =====================================================
                // RESIZE WATERMARK
                // =====================================================

                watermarkImage.Mutate(ctx =>
                {
                    ctx.Resize(
                        targetWatermarkWidth,
                        targetWatermarkHeight
                    );
                });


                // =====================================================
                // APPLY OPACITY
                // =====================================================

                if (opacity < 100)
                {
                    watermarkImage.Mutate(ctx =>
                    {
                        ctx.Opacity(
                            opacity / 100f
                        );
                    });
                }


                // =====================================================
                // CALCULATE POSITION
                // =====================================================

                int x = margin;

                int y = margin;


                switch (position)
                {
                    case "top-left":

                        x = margin;
                        y = margin;

                        break;


                    case "top-center":

                        x =
                            (
                                sourceImage.Width -
                                watermarkImage.Width
                            ) / 2;

                        y = margin;

                        break;


                    case "top-right":

                        x =
                            sourceImage.Width -
                            watermarkImage.Width -
                            margin;

                        y = margin;

                        break;


                    case "center-left":

                        x = margin;

                        y =
                            (
                                sourceImage.Height -
                                watermarkImage.Height
                            ) / 2;

                        break;


                    case "center":

                        x =
                            (
                                sourceImage.Width -
                                watermarkImage.Width
                            ) / 2;

                        y =
                            (
                                sourceImage.Height -
                                watermarkImage.Height
                            ) / 2;

                        break;


                    case "center-right":

                        x =
                            sourceImage.Width -
                            watermarkImage.Width -
                            margin;

                        y =
                            (
                                sourceImage.Height -
                                watermarkImage.Height
                            ) / 2;

                        break;


                    case "bottom-left":

                        x = margin;

                        y =
                            sourceImage.Height -
                            watermarkImage.Height -
                            margin;

                        break;


                    case "bottom-center":

                        x =
                            (
                                sourceImage.Width -
                                watermarkImage.Width
                            ) / 2;

                        y =
                            sourceImage.Height -
                            watermarkImage.Height -
                            margin;

                        break;


                    case "bottom-right":

                        x =
                            sourceImage.Width -
                            watermarkImage.Width -
                            margin;

                        y =
                            sourceImage.Height -
                            watermarkImage.Height -
                            margin;

                        break;
                }


                // =====================================================
                // FINAL POSITION CLAMP
                // =====================================================

                int maxX =
                    Math.Max(
                        0,
                        sourceImage.Width -
                        watermarkImage.Width
                    );


                int maxY =
                    Math.Max(
                        0,
                        sourceImage.Height -
                        watermarkImage.Height
                    );


                x =
                    Math.Max(
                        0,
                        Math.Min(
                            x,
                            maxX
                        )
                    );


                y =
                    Math.Max(
                        0,
                        Math.Min(
                            y,
                            maxY
                        )
                    );


                // =====================================================
                // APPLY WATERMARK
                // =====================================================

                sourceImage.Mutate(ctx =>
                {
                    ctx.DrawImage(
                        watermarkImage,
                        new Point(x, y),
                        1f
                    );
                });


                // =====================================================
                // CREATE OUTPUT
                // =====================================================

                using var outputStream =
                    new MemoryStream();


                string contentType;


                switch (outputFormat)
                {
                    case "jpg":
                    case "jpeg":

                        await sourceImage.SaveAsJpegAsync(
                            outputStream,
                            new JpegEncoder
                            {
                                Quality = 90
                            }
                        );

                        contentType =
                            "image/jpeg";

                        break;


                    case "webp":

                        await sourceImage.SaveAsWebpAsync(
                            outputStream,
                            new WebpEncoder
                            {
                                Quality = 90
                            }
                        );

                        contentType =
                            "image/webp";

                        break;


                    default:

                        await sourceImage.SaveAsPngAsync(
                            outputStream,
                            new PngEncoder()
                        );

                        contentType =
                            "image/png";

                        break;
                }


                // =====================================================
                // CREATE RESULT
                // =====================================================

                var bytes =
                    outputStream.ToArray();


                var base64 =
                    Convert.ToBase64String(bytes);


                string extension =
                    outputFormat == "jpeg"
                        ? "jpg"
                        : outputFormat;


                string originalName =
                    Path.GetFileNameWithoutExtension(
                        image.FileName
                    );


                string fileName =
                    $"{originalName}-watermarked.{extension}";


                // =====================================================
                // RETURN JSON
                // =====================================================

                return Json(new
                {
                    success = true,

                    data = base64,

                    contentType = contentType,

                    fileName = fileName,

                    width = sourceImage.Width,

                    height = sourceImage.Height,

                    fileSize = bytes.Length,

                    outputFormat = outputFormat
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    "Watermark error: " + ex
                );


                return StatusCode(
                    500,
                    new
                    {
                        message =
                            "Unable to apply the watermark."
                    }
                );
            }
        }
    }
}