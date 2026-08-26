using ImageForge.Services;
using Microsoft.AspNetCore.Mvc;
using System.IO.Compression;

namespace ImageForge.Controllers;

public class ConverterController : Controller
{
    private readonly ImageConversionService _conversionService;

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
            ".webp",
            ".bmp",
            ".gif",
            ".tif",
            ".tiff"
        };

    private static readonly HashSet<string> AllowedContentTypes =
        new(StringComparer.OrdinalIgnoreCase)
        {
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/bmp",
            "image/gif",
            "image/tiff"
        };

    private static readonly HashSet<string> AllowedOutputFormats =
        new(StringComparer.OrdinalIgnoreCase)
        {
            "jpg",
            "jpeg",
            "png",
            "webp",
            "bmp",
            "gif",
            "tiff",
            "tif"
        };


    // =========================
    // CONSTRUCTOR
    // =========================

    public ConverterController(
        ImageConversionService conversionService)
    {
        _conversionService = conversionService;
    }


    // =========================
    // IMAGE CONVERSION
    // =========================

    [HttpPost]
    [RequestSizeLimit(420 * 1024 * 1024)]
    public async Task<IActionResult> Convert(
        List<IFormFile> files,
        string outputFormat,
        int quality = 85,
        CancellationToken cancellationToken = default)
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
            return BadRequest(
                "Output format is required.");
        }


        outputFormat =
            outputFormat
                .Trim()
                .TrimStart('.')
                .ToLowerInvariant();


        if (!AllowedOutputFormats.Contains(outputFormat))
        {
            return BadRequest(
                $"The output format '{outputFormat}' is not supported.");
        }


        // =========================
        // QUALITY
        // =========================

        if (quality < 1 || quality > 100)
        {
            quality = 85;
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
            cancellationToken.ThrowIfCancellationRequested();


            // -------------------------
            // FILE VALIDATION
            // -------------------------

            if (file == null)
            {
                continue;
            }


            if (file.Length <= 0)
            {
                continue;
            }


            // -------------------------
            // FILE SIZE
            // -------------------------

            if (file.Length > MaxFileSize)
            {
                return BadRequest(
                    $"'{Path.GetFileName(file.FileName)}' exceeds the 20 MB file size limit.");
            }


            // -------------------------
            // SAFE FILE NAME
            // -------------------------

            string safeOriginalName =
                Path.GetFileName(file.FileName);


            if (string.IsNullOrWhiteSpace(safeOriginalName))
            {
                return BadRequest(
                    "One of the uploaded files has an invalid file name.");
            }


            // -------------------------
            // EXTENSION
            // -------------------------

            string extension =
                Path.GetExtension(safeOriginalName)
                    .ToLowerInvariant();


            if (!AllowedExtensions.Contains(extension))
            {
                return BadRequest(
                    $"'{safeOriginalName}' is not a supported image format.");
            }


            // -------------------------
            // CONTENT TYPE
            // -------------------------

            if (!string.IsNullOrWhiteSpace(file.ContentType) &&
                !AllowedContentTypes.Contains(file.ContentType))
            {
                return BadRequest(
                    $"'{safeOriginalName}' is not recognized as a supported image.");
            }


            // =========================
            // CONVERSION
            // =========================

            try
            {
                cancellationToken.ThrowIfCancellationRequested();


                await using var inputStream =
                    file.OpenReadStream();


                byte[] convertedImage =
                    await _conversionService.ConvertAsync(
                        inputStream,
                        outputFormat,
                        quality,
                        cancellationToken);


                if (convertedImage.Length == 0)
                {
                    return BadRequest(
                        $"Unable to convert '{safeOriginalName}'.");
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


                string convertedExtension =
                    outputFormat
                        .TrimStart('.')
                        .ToUpperInvariant();


                string normalizedOutputFormat =
                    outputFormat
                        .TrimStart('.')
                        .ToLowerInvariant();


                string uniqueId =
     Guid.NewGuid()
         .ToString("N")
         .Substring(0, 8);

                string outputName =
                    $"{originalName}-{uniqueId}.{normalizedOutputFormat}";

                // =========================
                // ADD RESULT
                // =========================

                results.Add(new
                {
                    FileName = outputName,

                    ContentType =
                        GetContentType(outputFormat),

                    Data =
                        System.Convert.ToBase64String(
                            convertedImage),

                    OriginalFileName =
                        safeOriginalName,

                    OriginalSize =
                        file.Length,

                    ConvertedSize =
                        convertedImage.Length,

                    OriginalFormat =
                        originalExtension,

                    ConvertedFormat =
                        convertedExtension
                });
            }
            catch (
                SixLabors.ImageSharp.UnknownImageFormatException)
            {
                return BadRequest(
                    $"'{safeOriginalName}' is not a valid image file.");
            }
            catch (
                SixLabors.ImageSharp.InvalidImageContentException)
            {
                return BadRequest(
                    $"'{safeOriginalName}' contains invalid image data.");
            }
            catch (OperationCanceledException)
            {
                return BadRequest(
                    "Image conversion was cancelled.");
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"Conversion error for {safeOriginalName}: {ex}");

                return BadRequest(
                    $"Unable to convert '{safeOriginalName}'.");
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


        // =========================
        // RETURN RESULTS
        // =========================

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

            "bmp" =>
                "image/bmp",

            "gif" =>
                "image/gif",

            "tiff" or "tif" =>
                "image/tiff",

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
        // =========================
        // BASIC VALIDATION
        // =========================

        if (files == null || files.Count == 0)
        {
            return BadRequest(
                "No converted files were supplied.");
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


            // =========================
            // USED FILE NAMES
            // =========================

            var usedFileNames =
                new HashSet<string>(
                    StringComparer.OrdinalIgnoreCase);


            // =========================
            // CREATE ZIP
            // =========================

            using (var archive =
                new ZipArchive(
                    memoryStream,
                    ZipArchiveMode.Create,
                    true))
            {
                foreach (var file in files)
                {
                    // -------------------------
                    // VALIDATE DATA
                    // -------------------------

                    if (file == null ||
                        string.IsNullOrWhiteSpace(file.Data))
                    {
                        continue;
                    }


                    // -------------------------
                    // DECODE BASE64
                    // -------------------------

                    byte[] fileBytes;


                    try
                    {
                        fileBytes =
                            System.Convert.FromBase64String(
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


                    // -------------------------
                    // SAFE FILE NAME
                    // -------------------------

                    string safeFileName =
                        Path.GetFileName(
                            file.FileName);


                    if (string.IsNullOrWhiteSpace(safeFileName))
                    {
                        safeFileName =
                            $"image-{Guid.NewGuid():N}.bin";
                    }


                    // -------------------------
                    // UNIQUE FILE NAME
                    // -------------------------

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


                    // -------------------------
                    // CREATE ZIP ENTRY
                    // -------------------------

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


            // =========================
            // ZIP BYTES
            // =========================

            byte[] zipBytes =
                memoryStream.ToArray();


            if (zipBytes.Length == 0)
            {
                return BadRequest(
                    "Unable to create ZIP file.");
            }


            // =========================
            // RETURN ZIP
            // =========================

            return File(
                zipBytes,
                "application/zip",
                "ImageForge-Converted.zip");
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