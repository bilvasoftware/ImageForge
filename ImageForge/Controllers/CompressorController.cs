using ImageForge.Services;
using Microsoft.AspNetCore.Mvc;
using System.IO.Compression;

namespace ImageForge.Controllers;

public class CompressorController : Controller
{
    private readonly ImageCompressionService _compressionService;

    // =========================
    // UPLOAD SECURITY SETTINGS
    // =========================

    private const long MaxFileSize = 20 * 1024 * 1024; // 20 MB
    private const int MaxFiles = 20;

    private static readonly HashSet<string> AllowedExtensions =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ".jpg",
            ".jpeg",
            ".png",
            ".webp"
        };

    private static readonly HashSet<string> AllowedContentTypes =
        new(StringComparer.OrdinalIgnoreCase)
        {
            "image/jpeg",
            "image/png",
            "image/webp"
        };


    // =========================
    // CONSTRUCTOR
    // =========================

    public CompressorController(
        ImageCompressionService compressionService)
    {
        _compressionService = compressionService;
    }


    // =========================
    // COMPRESSOR PAGE
    // =========================

    [HttpGet]
    public IActionResult Index()
    {
        return View("~/Views/Compressor/Index.cshtml");
    }


    // =========================
    // COMPRESS IMAGES
    // =========================

    [HttpPost]
    [RequestSizeLimit(420 * 1024 * 1024)]
    public async Task<IActionResult> Compress(
        List<IFormFile> files,
        string outputFormat = "webp",
        int quality = 85,
        string compressionMethod = "quality",
        double targetSize = 0,
        string targetSizeUnit = "KB")
    {
        // =========================
        // BASIC VALIDATION
        // =========================

        if (files == null || files.Count == 0)
        {
            return BadRequest(
                "No images were uploaded.");
        }


        if (files.Count > MaxFiles)
        {
            return BadRequest(
                $"You can upload a maximum of {MaxFiles} images at once.");
        }


        // =========================
        // OUTPUT FORMAT
        // =========================

        if (string.IsNullOrWhiteSpace(outputFormat))
        {
            outputFormat = "webp";
        }

        outputFormat =
            outputFormat
                .Trim()
                .TrimStart('.')
                .ToLowerInvariant();


        var allowedOutputFormats =
            new HashSet<string>(
                StringComparer.OrdinalIgnoreCase)
            {
                "jpg",
                "jpeg",
                "png",
                "webp"
            };


        if (!allowedOutputFormats.Contains(
                outputFormat))
        {
            return BadRequest(
                $"The output format '{outputFormat}' is not supported for compression.");
        }


        // =========================
        // QUALITY
        // =========================

        if (quality < 1 || quality > 100)
        {
            quality = 85;
        }


        // =========================
        // COMPRESSION METHOD
        // =========================

        compressionMethod =
            string.IsNullOrWhiteSpace(compressionMethod)
                ? "quality"
                : compressionMethod
                    .Trim()
                    .ToLowerInvariant();


        if (compressionMethod != "quality" &&
            compressionMethod != "size")
        {
            compressionMethod = "quality";
        }


        // =========================
        // TARGET SIZE
        // =========================

        long targetSizeBytes = 0;


        if (compressionMethod == "size")
        {
            if (targetSize <= 0)
            {
                return BadRequest(
                    "Please enter a valid target file size.");
            }


            targetSizeUnit =
                string.IsNullOrWhiteSpace(targetSizeUnit)
                    ? "KB"
                    : targetSizeUnit
                        .Trim()
                        .ToUpperInvariant();


            if (targetSizeUnit != "KB" &&
                targetSizeUnit != "MB")
            {
                return BadRequest(
                    "Target size unit must be KB or MB.");
            }


            try
            {
                double multiplier =
                    targetSizeUnit == "MB"
                        ? 1024d * 1024d
                        : 1024d;


                double calculatedBytes =
                    targetSize * multiplier;


                if (calculatedBytes <= 0 ||
                    calculatedBytes >
                    long.MaxValue)
                {
                    return BadRequest(
                        "The target file size is invalid.");
                }


                targetSizeBytes =
                    (long)Math.Round(
                        calculatedBytes);
            }
            catch
            {
                return BadRequest(
                    "The target file size is invalid.");
            }


            if (targetSizeBytes < 1024)
            {
                return BadRequest(
                    "Target file size must be at least 1 KB.");
            }


            if (targetSizeBytes >
                MaxFileSize)
            {
                return BadRequest(
                    "Target file size cannot exceed 20 MB.");
            }
        }


        // =========================
        // RESULTS
        // =========================

        var results =
            new List<object>();


        // =========================
        // PROCESS FILES
        // =========================

        foreach (var file in files)
        {
            if (file == null ||
                file.Length <= 0)
            {
                continue;
            }


            // =========================
            // FILE SIZE
            // =========================

            if (file.Length > MaxFileSize)
            {
                return BadRequest(
                    $"'{Path.GetFileName(file.FileName)}' exceeds the 20 MB file size limit.");
            }


            // =========================
            // SAFE FILE NAME
            // =========================

            string safeOriginalName =
                Path.GetFileName(
                    file.FileName);


            if (string.IsNullOrWhiteSpace(
                    safeOriginalName))
            {
                return BadRequest(
                    "One of the uploaded files has an invalid file name.");
            }


            // =========================
            // EXTENSION
            // =========================

            string extension =
                Path.GetExtension(
                    safeOriginalName)
                    .ToLowerInvariant();


            if (!AllowedExtensions.Contains(
                    extension))
            {
                return BadRequest(
                    $"'{safeOriginalName}' is not a supported image format.");
            }


            // =========================
            // CONTENT TYPE
            // =========================

            if (!string.IsNullOrWhiteSpace(
                    file.ContentType) &&
                !AllowedContentTypes.Contains(
                    file.ContentType))
            {
                return BadRequest(
                    $"'{safeOriginalName}' is not recognized as a supported image.");
            }


            try
            {
                // =========================
                // OPEN IMAGE
                // =========================

                await using var inputStream =
                    file.OpenReadStream();


                // =========================
                // COMPRESS
                // =========================

                byte[] compressedImage =
                    await _compressionService.CompressAsync(
                        inputStream,
                        outputFormat,
                        quality);


                if (compressedImage.Length == 0)
                {
                    return BadRequest(
                        $"Unable to compress '{safeOriginalName}'.");
                }


                // =========================
                // TARGET SIZE CHECK
                // =========================

                if (compressionMethod == "size" &&
                    targetSizeBytes > 0)
                {
                    if (compressedImage.Length >
                        targetSizeBytes)
                    {
                        return BadRequest(
                            $"Unable to compress '{safeOriginalName}' to the requested target size of {targetSize} {targetSizeUnit} with the current compression service.");
                    }
                }


                // =========================
                // FILE INFORMATION
                // =========================

                string originalName =
                    Path.GetFileNameWithoutExtension(
                        safeOriginalName);


                string originalExtension =
                    extension
                        .TrimStart('.')
                        .ToUpperInvariant();


                string compressedExtension =
                    outputFormat
                        .TrimStart('.')
                        .ToUpperInvariant();


                string outputName =
                    $"{originalName}.{outputFormat}";


                int savingPercentage = 0;


                if (file.Length > 0 &&
                    compressedImage.Length <
                    file.Length)
                {
                    savingPercentage =
                        (int)Math.Round(
                            (
                                (
                                    (double)file.Length -
                                    compressedImage.Length
                                ) /
                                file.Length
                            ) * 100
                        );
                }


                // =========================
                // RESULT
                // =========================

                results.Add(new
                {
                    FileName = outputName,

                    ContentType =
                        GetContentType(
                            outputFormat),

                    Data =
                        Convert.ToBase64String(
                            compressedImage),

                    OriginalFileName =
                        safeOriginalName,

                    OriginalSize =
                        file.Length,

                    CompressedSize =
                        compressedImage.Length,

                    OriginalFormat =
                        originalExtension,

                    CompressedFormat =
                        compressedExtension,

                    SavingPercentage =
                        savingPercentage,

                    CompressionMethod =
                        compressionMethod,

                    TargetSize =
                        targetSize,

                    TargetSizeUnit =
                        targetSizeUnit
                });
            }
            catch (
                SixLabors.ImageSharp
                    .UnknownImageFormatException)
            {
                return BadRequest(
                    $"'{safeOriginalName}' is not a valid image file.");
            }
            catch (
                SixLabors.ImageSharp
                    .InvalidImageContentException)
            {
                return BadRequest(
                    $"'{safeOriginalName}' contains invalid image data.");
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"Compression error for {safeOriginalName}: {ex}");

                return BadRequest(
                    $"Unable to compress '{safeOriginalName}'.");
            }
        }


        // =========================
        // NO RESULTS
        // =========================

        if (results.Count == 0)
        {
            return BadRequest(
                "No valid images were processed.");
        }


        return Json(results);
    }


    // =========================
    // CONTENT TYPE
    // =========================

    private static string GetContentType(
        string extension)
    {
        return extension
            .TrimStart('.')
            .ToLowerInvariant() switch
        {
            "jpg" or "jpeg" =>
                "image/jpeg",

            "png" =>
                "image/png",

            "webp" =>
                "image/webp",

            _ =>
                "application/octet-stream"
        };
    }


    // =========================
    // DOWNLOAD ALL AS ZIP
    // =========================

    [HttpPost]
    [RequestSizeLimit(500 * 1024 * 1024)]
    public IActionResult DownloadAll(
        [FromBody] List<ZipFileRequest> files)
    {
        if (files == null ||
            files.Count == 0)
        {
            return BadRequest(
                "No compressed files were supplied.");
        }


        if (files.Count > MaxFiles)
        {
            return BadRequest(
                $"You can download a maximum of {MaxFiles} files at once.");
        }


        try
        {
            using var memoryStream =
                new MemoryStream();


            var usedFileNames =
                new HashSet<string>(
                    StringComparer.OrdinalIgnoreCase);


            using (var archive =
                new ZipArchive(
                    memoryStream,
                    ZipArchiveMode.Create,
                    true))
            {
                foreach (var file in files)
                {
                    if (file == null ||
                        string.IsNullOrWhiteSpace(
                            file.Data))
                    {
                        continue;
                    }


                    byte[] fileBytes;


                    try
                    {
                        fileBytes =
                            Convert.FromBase64String(
                                file.Data);
                    }
                    catch
                    {
                        continue;
                    }


                    if (fileBytes.Length == 0)
                    {
                        continue;
                    }


                    // =========================
                    // SAFE ZIP FILE NAME
                    // =========================

                    string safeFileName =
                        Path.GetFileName(
                            file.FileName);


                    if (string.IsNullOrWhiteSpace(
                            safeFileName))
                    {
                        safeFileName =
                            $"compressed-{Guid.NewGuid():N}.webp";
                    }


                    string uniqueFileName =
                        safeFileName;


                    int counter = 1;


                    while (!usedFileNames.Add(
                        uniqueFileName))
                    {
                        string name =
                            Path.GetFileNameWithoutExtension(
                                safeFileName);


                        string extension =
                            Path.GetExtension(
                                safeFileName);


                        uniqueFileName =
                            $"{name}-{counter}{extension}";


                        counter++;
                    }


                    var entry =
                        archive.CreateEntry(
                            uniqueFileName,
                            CompressionLevel.Fastest);


                    using var entryStream =
                        entry.Open();


                    entryStream.Write(
                        fileBytes,
                        0,
                        fileBytes.Length);
                }
            }


            byte[] zipBytes =
                memoryStream.ToArray();


            if (zipBytes.Length == 0)
            {
                return BadRequest(
                    "Unable to create ZIP file.");
            }


            return File(
                zipBytes,
                "application/zip",
                "ImageForge-Compressed.zip");
        }
        catch (Exception ex)
        {
            Console.WriteLine(
                $"ZIP creation error: {ex}");

            return BadRequest(
                "Unable to create ZIP file.");
        }
    }


    // =========================
    // ZIP REQUEST MODEL
    // =========================

    public class ZipFileRequest
    {
        public string FileName { get; set; } =
            string.Empty;

        public string Data { get; set; } =
            string.Empty;
    }
}