using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Bmp;
using SixLabors.ImageSharp.Formats.Gif;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.Formats.Tiff;
using SixLabors.ImageSharp.Formats.Webp;

namespace ImageForge.Services;

public class ImageConversionService
{

    public async Task<byte[]> ConvertAsync(
    Stream inputStream,
    string outputFormat,
    int quality = 85,
    CancellationToken cancellationToken = default)
    {
        using var image =
     await Image.LoadAsync(
         inputStream,
         cancellationToken);

        using var outputStream =
            new MemoryStream();

        switch (outputFormat.ToLowerInvariant())
        {
            case "jpg":
            case "jpeg":

                await image.SaveAsJpegAsync(
                    outputStream,
                    new JpegEncoder
                    {
                        Quality = quality
                    });

                break;

            case "png":

                await image.SaveAsPngAsync(
                    outputStream,
                    new PngEncoder());

                break;

            case "webp":

                await image.SaveAsWebpAsync(
                    outputStream,
                    new WebpEncoder
                    {
                        Quality = quality
                    });

                break;

            case "bmp":

                await image.SaveAsBmpAsync(
                    outputStream,
                    new BmpEncoder());

                break;

            case "gif":

                await image.SaveAsGifAsync(
                    outputStream,
                    new GifEncoder());

                break;

            case "tiff":
            case "tif":

                await image.SaveAsTiffAsync(
                    outputStream,
                    new TiffEncoder());

                break;

            default:

                throw new NotSupportedException(
                    $"The output format '{outputFormat}' is not supported.");
        }

        return outputStream.ToArray();
    }

    // =========================
    // PNG COMPRESSION
    // =========================
}