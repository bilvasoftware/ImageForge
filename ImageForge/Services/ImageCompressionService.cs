using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.Formats.Webp;

namespace ImageForge.Services;

public class ImageCompressionService
{
    // =========================
    // NORMAL COMPRESSION
    // =========================

    public async Task<byte[]> CompressAsync(
        Stream inputStream,
        string outputFormat,
        int quality = 85,
        CancellationToken cancellationToken = default)
    {
        using var image =
            await Image.LoadAsync(
                inputStream,
                cancellationToken);

        return await EncodeImageAsync(
            image,
            outputFormat,
            quality,
            cancellationToken);
    }


    // =========================
    // TARGET SIZE COMPRESSION
    // =========================

    public async Task<byte[]> CompressToTargetSizeAsync(
        Stream inputStream,
        string outputFormat,
        long targetBytes,
        int startingQuality = 85,
        CancellationToken cancellationToken = default)
    {
        if (targetBytes <= 0)
        {
            throw new ArgumentException(
                "Target size must be greater than zero.",
                nameof(targetBytes));
        }

        using var image =
            await Image.LoadAsync(
                inputStream,
                cancellationToken);


        // PNG does not have the same quality-based
        // compression behavior as JPEG/WEBP.
        //
        // For PNG, perform the best available
        // PNG compression and return the result.

        if (outputFormat.Equals(
                "png",
                StringComparison.OrdinalIgnoreCase))
        {
            return await EncodeImageAsync(
                image,
                "png",
                100,
                cancellationToken);
        }


        // =========================
        // QUALITY SEARCH
        // =========================

        int minimumQuality = 10;
        int maximumQuality = 100;

        byte[] bestResult = Array.Empty<byte>();


        // First try maximum quality.

        byte[] maximumQualityResult =
            await EncodeImageAsync(
                image,
                outputFormat,
                maximumQuality,
                cancellationToken);


        if (maximumQualityResult.Length <= targetBytes)
        {
            return maximumQualityResult;
        }


        // Try the lowest quality first.

        byte[] minimumQualityResult =
            await EncodeImageAsync(
                image,
                outputFormat,
                minimumQuality,
                cancellationToken);


        // Even minimum quality is larger than target.
        //
        // We cannot guarantee an exact target size
        // without resizing the image.

        if (minimumQualityResult.Length > targetBytes)
        {
            return minimumQualityResult;
        }


        // Minimum quality is small enough.
        // Use binary search to find the highest
        // quality that remains below the target.

        int low = minimumQuality;
        int high = maximumQuality;

        bestResult = minimumQualityResult;


        while (low <= high)
        {
            cancellationToken.ThrowIfCancellationRequested();

            int quality =
                low + ((high - low) / 2);


            byte[] result =
                await EncodeImageAsync(
                    image,
                    outputFormat,
                    quality,
                    cancellationToken);


            if (result.Length <= targetBytes)
            {
                bestResult = result;

                low = quality + 1;
            }
            else
            {
                high = quality - 1;
            }
        }


        return bestResult;
    }


    // =========================
    // ENCODING
    // =========================

    private static async Task<byte[]> EncodeImageAsync(
        Image image,
        string outputFormat,
        int quality,
        CancellationToken cancellationToken)
    {
        using var outputStream =
            new MemoryStream();


        switch (
            outputFormat
                .Trim()
                .TrimStart('.')
                .ToLowerInvariant())
        {
            case "jpg":
            case "jpeg":

                await image.SaveAsJpegAsync(
                    outputStream,
                    new JpegEncoder
                    {
                        Quality = quality
                    },
                    cancellationToken);

                break;


            case "webp":

                await image.SaveAsWebpAsync(
                    outputStream,
                    new WebpEncoder
                    {
                        Quality = quality
                    },
                    cancellationToken);

                break;


            case "png":

                await image.SaveAsPngAsync(
                    outputStream,
                    new PngEncoder(),
                    cancellationToken);

                break;


            default:

                throw new NotSupportedException(
                    $"The compression format '{outputFormat}' is not supported.");
        }


        return outputStream.ToArray();
    }
}