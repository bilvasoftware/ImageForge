document.addEventListener("DOMContentLoaded", () => {

    // =========================================================
    // DOM
    // =========================================================

    const watermarkImageInput =
        document.getElementById("watermarkImageInput");

    const watermarkChooseImage =
        document.getElementById("watermarkChooseImage");

    const watermarkUploadZone =
        document.getElementById("watermarkUploadZone");

    const watermarkWorkspace =
        document.getElementById("watermarkWorkspace");

    const watermarkImageInfo =
        document.getElementById("watermarkImageInfo");

    const watermarkClearImage =
        document.getElementById("watermarkClearImage");

    const watermarkCanvas =
        document.getElementById("watermarkCanvas");

    const watermarkCanvasContainer =
        document.getElementById("watermarkCanvasContainer");

    const watermarkOverlayInput =
        document.getElementById("watermarkOverlayInput");

    const watermarkChooseOverlay =
        document.getElementById("watermarkChooseOverlay");

    const watermarkOverlayInfo =
        document.getElementById("watermarkOverlayInfo");

    const watermarkOpacity =
        document.getElementById("watermarkOpacity");

    const watermarkOpacityValue =
        document.getElementById("watermarkOpacityValue");

    const watermarkScale =
        document.getElementById("watermarkScale");

    const watermarkScaleValue =
        document.getElementById("watermarkScaleValue");

    const watermarkMargin =
        document.getElementById("watermarkMargin");

    const watermarkMarginValue =
        document.getElementById("watermarkMarginValue");

    const watermarkOutputFormat =
        document.getElementById("watermarkOutputFormat");

    const watermarkApplyButton =
        document.getElementById("watermarkApplyButton");

    const watermarkResetButton =
        document.getElementById("watermarkResetButton");

    const watermarkPositionButtons =
        document.querySelectorAll(
            ".watermark-position-button"
        );

    const watermarkResultSection =
        document.getElementById("watermarkResultSection");

    const watermarkResultImage =
        document.getElementById("watermarkResultImage");

    const watermarkResultFileName =
        document.getElementById("watermarkResultFileName");

    const watermarkResultWidth =
        document.getElementById("watermarkResultWidth");

    const watermarkResultHeight =
        document.getElementById("watermarkResultHeight");

    const watermarkResultSize =
        document.getElementById("watermarkResultSize");

    const watermarkDownloadButton =
        document.getElementById("watermarkDownloadButton");

    const watermarkAnotherButton =
        document.getElementById("watermarkAnotherButton");


    // =========================================================
    // SAFETY CHECK
    // =========================================================

    if (
        !watermarkImageInput ||
        !watermarkChooseImage ||
        !watermarkUploadZone ||
        !watermarkWorkspace ||
        !watermarkImageInfo ||
        !watermarkClearImage ||
        !watermarkCanvas ||
        !watermarkCanvasContainer ||
        !watermarkOverlayInput ||
        !watermarkChooseOverlay ||
        !watermarkOverlayInfo ||
        !watermarkOpacity ||
        !watermarkOpacityValue ||
        !watermarkScale ||
        !watermarkScaleValue ||
        !watermarkMargin ||
        !watermarkMarginValue ||
        !watermarkOutputFormat ||
        !watermarkApplyButton ||
        !watermarkResetButton ||
        !watermarkResultSection ||
        !watermarkResultImage ||
        !watermarkResultFileName ||
        !watermarkResultWidth ||
        !watermarkResultHeight ||
        !watermarkResultSize ||
        !watermarkDownloadButton ||
        !watermarkAnotherButton
    ) {

        console.error(
            "ImageForge Watermark: Required DOM elements are missing."
        );

        return;
    }


    // =========================================================
    // CANVAS
    // =========================================================

    const ctx =
        watermarkCanvas.getContext("2d");


    // =========================================================
    // STATE
    // =========================================================

    let selectedImageFile = null;

    let selectedWatermarkFile = null;

    let imageObjectUrl = null;

    let watermarkObjectUrl = null;

    let mainImage = null;

    let watermarkImage = null;

    let selectedPosition = "center";

    let currentResult = null;


    // =========================================================
    // MAIN IMAGE UPLOAD
    // =========================================================

    watermarkChooseImage.addEventListener(
        "click",
        () => {

            watermarkImageInput.click();

        }
    );


    watermarkUploadZone.addEventListener(
        "click",
        event => {

            if (
                event.target.closest(
                    "#watermarkChooseImage"
                )
            ) {
                return;
            }

            watermarkImageInput.click();

        }
    );


    watermarkImageInput.addEventListener(
        "change",
        event => {

            const file =
                event.target.files &&
                event.target.files[0];

            if (!file) {
                return;
            }

            loadMainImage(file);

        }
    );


    // =========================================================
    // MAIN IMAGE DRAG & DROP
    // =========================================================

    [
        "dragenter",
        "dragover"
    ].forEach(eventName => {

        watermarkUploadZone.addEventListener(
            eventName,
            event => {

                event.preventDefault();
                event.stopPropagation();

                watermarkUploadZone.classList.add(
                    "drag-active"
                );

            }
        );

    });


    [
        "dragleave",
        "drop"
    ].forEach(eventName => {

        watermarkUploadZone.addEventListener(
            eventName,
            event => {

                event.preventDefault();
                event.stopPropagation();

                watermarkUploadZone.classList.remove(
                    "drag-active"
                );

            }
        );

    });


    watermarkUploadZone.addEventListener(
        "drop",
        event => {

            const files =
                Array.from(
                    event.dataTransfer.files || []
                );

            if (!files.length) {
                return;
            }

            loadMainImage(files[0]);

        }
    );


    // =========================================================
    // LOAD MAIN IMAGE
    // =========================================================

    function loadMainImage(file) {

        if (
            !isSupportedImage(file)
        ) {

            showMessage(
                "Please select a JPG, PNG, or WEBP image.",
                true
            );

            return;
        }


        selectedImageFile = file;


        if (imageObjectUrl) {

            URL.revokeObjectURL(
                imageObjectUrl
            );

        }


        imageObjectUrl =
            URL.createObjectURL(file);


        const image =
            new Image();


        image.onload = () => {

            mainImage = image;


            watermarkImageInfo.textContent =
                `${image.naturalWidth} × ${image.naturalHeight}px • ${formatFileSize(file.size)}`;


            watermarkWorkspace.hidden =
                false;


            watermarkResultSection.hidden =
                true;


            drawPreview();

        };


        image.onerror = () => {

            showMessage(
                "Unable to load this image.",
                true
            );

        };


        image.src =
            imageObjectUrl;
    }


    // =========================================================
    // WATERMARK UPLOAD
    // =========================================================

    watermarkChooseOverlay.addEventListener(
        "click",
        () => {

            watermarkOverlayInput.click();

        }
    );


    watermarkOverlayInput.addEventListener(
        "change",
        event => {

            const file =
                event.target.files &&
                event.target.files[0];

            if (!file) {
                return;
            }

            loadWatermark(file);

        }
    );


    // =========================================================
    // LOAD WATERMARK
    // =========================================================

    function loadWatermark(file) {

        if (
            !isSupportedImage(file)
        ) {

            showMessage(
                "Please select a JPG, PNG, or WEBP watermark.",
                true
            );

            return;
        }


        selectedWatermarkFile =
            file;


        if (watermarkObjectUrl) {

            URL.revokeObjectURL(
                watermarkObjectUrl
            );

        }


        watermarkObjectUrl =
            URL.createObjectURL(file);


        const image =
            new Image();


        image.onload = () => {

            watermarkImage =
                image;


            watermarkOverlayInfo.textContent =
                `${file.name} • ${image.naturalWidth} × ${image.naturalHeight}px`;


            drawPreview();

        };


        image.onerror = () => {

            showMessage(
                "Unable to load the watermark image.",
                true
            );

        };


        image.src =
            watermarkObjectUrl;
    }


    // =========================================================
    // OPACITY
    // =========================================================

    watermarkOpacity.addEventListener(
        "input",
        () => {

            const value =
                Number(
                    watermarkOpacity.value
                );


            watermarkOpacityValue.textContent =
                `${value}%`;


            drawPreview();

        }
    );


    // =========================================================
    // SCALE
    // =========================================================

    watermarkScale.addEventListener(
        "input",
        () => {

            const value =
                Number(
                    watermarkScale.value
                );


            watermarkScaleValue.textContent =
                `${value}%`;


            drawPreview();

        }
    );


    // =========================================================
    // MARGIN
    // =========================================================

    watermarkMargin.addEventListener(
        "input",
        () => {

            const value =
                Number(
                    watermarkMargin.value
                );


            watermarkMarginValue.textContent =
                `${value} px`;


            drawPreview();

        }
    );


    // =========================================================
    // POSITION
    // =========================================================

    watermarkPositionButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    selectedPosition =
                        button.dataset.position ||
                        "center";


                    watermarkPositionButtons.forEach(
                        item => {

                            item.classList.remove(
                                "active"
                            );

                        }
                    );


                    button.classList.add(
                        "active"
                    );


                    drawPreview();

                }
            );

        }
    );


    // =========================================================
    // DRAW PREVIEW
    // =========================================================

    function drawPreview() {

        if (!mainImage) {
            return;
        }


        const naturalWidth =
            mainImage.naturalWidth;


        const naturalHeight =
            mainImage.naturalHeight;


        if (
            naturalWidth <= 0 ||
            naturalHeight <= 0
        ) {
            return;
        }


        // -----------------------------------------------------
        // Determine preview size
        // -----------------------------------------------------

        const containerWidth =
            watermarkCanvasContainer.clientWidth;


        const maxPreviewWidth =
            Math.max(
                300,
                containerWidth - 20
            );


        const previewScale =
            Math.min(
                1,
                maxPreviewWidth /
                naturalWidth
            );


        const displayWidth =
            Math.max(
                1,
                Math.round(
                    naturalWidth *
                    previewScale
                )
            );


        const displayHeight =
            Math.max(
                1,
                Math.round(
                    naturalHeight *
                    previewScale
                )
            );


        watermarkCanvas.width =
            displayWidth;


        watermarkCanvas.height =
            displayHeight;


        watermarkCanvas.style.width =
            `${displayWidth}px`;


        watermarkCanvas.style.height =
            `${displayHeight}px`;


        // -----------------------------------------------------
        // Draw main image
        // -----------------------------------------------------

        ctx.clearRect(
            0,
            0,
            displayWidth,
            displayHeight
        );


        ctx.drawImage(
            mainImage,
            0,
            0,
            displayWidth,
            displayHeight
        );


        // -----------------------------------------------------
        // No watermark yet
        // -----------------------------------------------------

        if (!watermarkImage) {
            return;
        }


        // -----------------------------------------------------
        // Calculate watermark size
        // -----------------------------------------------------

        const watermarkNaturalWidth =
            watermarkImage.naturalWidth;


        const watermarkNaturalHeight =
            watermarkImage.naturalHeight;


        if (
            watermarkNaturalWidth <= 0 ||
            watermarkNaturalHeight <= 0
        ) {
            return;
        }


        const scalePercent =
            Number(
                watermarkScale.value
            );


        const targetWidth =
            displayWidth *
            (scalePercent / 100);


        const watermarkRatio =
            watermarkNaturalHeight /
            watermarkNaturalWidth;


        const targetHeight =
            targetWidth *
            watermarkRatio;


        // -----------------------------------------------------
        // Position
        // -----------------------------------------------------

        const margin =
            Number(
                watermarkMargin.value
            ) *
            previewScale;


        const position =
            calculateWatermarkPosition(
                displayWidth,
                displayHeight,
                targetWidth,
                targetHeight,
                margin
            );


        // -----------------------------------------------------
        // Opacity
        // -----------------------------------------------------

        const opacity =
            Number(
                watermarkOpacity.value
            ) / 100;


        ctx.save();


        ctx.globalAlpha =
            opacity;


        ctx.drawImage(
            watermarkImage,
            position.x,
            position.y,
            targetWidth,
            targetHeight
        );


        ctx.restore();

    }


    // =========================================================
    // POSITION CALCULATION
    // =========================================================

    function calculateWatermarkPosition(
        canvasWidth,
        canvasHeight,
        watermarkWidth,
        watermarkHeight,
        margin
    ) {

        let x = 0;
        let y = 0;


        switch (selectedPosition) {

            case "top-left":

                x =
                    margin;

                y =
                    margin;

                break;


            case "top-center":

                x =
                    (
                        canvasWidth -
                        watermarkWidth
                    ) / 2;

                y =
                    margin;

                break;


            case "top-right":

                x =
                    canvasWidth -
                    watermarkWidth -
                    margin;

                y =
                    margin;

                break;


            case "middle-left":

                x =
                    margin;

                y =
                    (
                        canvasHeight -
                        watermarkHeight
                    ) / 2;

                break;


            case "center":

                x =
                    (
                        canvasWidth -
                        watermarkWidth
                    ) / 2;

                y =
                    (
                        canvasHeight -
                        watermarkHeight
                    ) / 2;

                break;


            case "middle-right":

                x =
                    canvasWidth -
                    watermarkWidth -
                    margin;

                y =
                    (
                        canvasHeight -
                        watermarkHeight
                    ) / 2;

                break;


            case "bottom-left":

                x =
                    margin;

                y =
                    canvasHeight -
                    watermarkHeight -
                    margin;

                break;


            case "bottom-center":

                x =
                    (
                        canvasWidth -
                        watermarkWidth
                    ) / 2;

                y =
                    canvasHeight -
                    watermarkHeight -
                    margin;

                break;


            case "bottom-right":

                x =
                    canvasWidth -
                    watermarkWidth -
                    margin;

                y =
                    canvasHeight -
                    watermarkHeight -
                    margin;

                break;


            default:

                x =
                    (
                        canvasWidth -
                        watermarkWidth
                    ) / 2;

                y =
                    (
                        canvasHeight -
                        watermarkHeight
                    ) / 2;

                break;
        }


        // -----------------------------------------------------
        // Final safety clamp
        // -----------------------------------------------------

        x =
            Math.max(
                0,
                Math.min(
                    x,
                    canvasWidth -
                    watermarkWidth
                )
            );


        y =
            Math.max(
                0,
                Math.min(
                    y,
                    canvasHeight -
                    watermarkHeight
                )
            );


        return {
            x,
            y
        };
    }


    // =========================================================
    // APPLY WATERMARK
    // =========================================================

    watermarkApplyButton.addEventListener(
        "click",
        async () => {

            if (!selectedImageFile) {

                showMessage(
                    "Please select an image first.",
                    true
                );

                return;
            }


            if (!watermarkImage) {

                showMessage(
                    "Please upload a watermark image first.",
                    true
                );

                return;
            }


            watermarkApplyButton.disabled =
                true;


            const originalButtonText =
                watermarkApplyButton.innerHTML;


            watermarkApplyButton.innerHTML =
                "Applying Watermark...";


            try {

                const result =
                    await createWatermarkedImage();


                currentResult =
                    result;


                showWatermarkResult(
                    result
                );

            }
            catch (error) {

                console.error(
                    "Watermark error:",
                    error
                );


                showMessage(
                    error.message ||
                    "Unable to apply the watermark.",
                    true
                );

            }
            finally {

                watermarkApplyButton.disabled =
                    false;


                watermarkApplyButton.innerHTML =
                    originalButtonText;

            }

        }
    );


    // =========================================================
    // CREATE WATERMARKED IMAGE
    // =========================================================

    async function createWatermarkedImage() {

        const canvas =
            document.createElement(
                "canvas"
            );


        const context =
            canvas.getContext("2d");


        const imageWidth =
            mainImage.naturalWidth;


        const imageHeight =
            mainImage.naturalHeight;


        canvas.width =
            imageWidth;


        canvas.height =
            imageHeight;


        // -----------------------------------------------------
        // Main image
        // -----------------------------------------------------

        context.clearRect(
            0,
            0,
            imageWidth,
            imageHeight
        );


        context.drawImage(
            mainImage,
            0,
            0,
            imageWidth,
            imageHeight
        );


        // -----------------------------------------------------
        // Watermark size
        // -----------------------------------------------------

        const scalePercent =
            Number(
                watermarkScale.value
            );


        const watermarkWidth =
            imageWidth *
            (scalePercent / 100);


        const watermarkRatio =
            watermarkImage.naturalHeight /
            watermarkImage.naturalWidth;


        const watermarkHeight =
            watermarkWidth *
            watermarkRatio;


        // -----------------------------------------------------
        // Position
        // -----------------------------------------------------

        const margin =
            Number(
                watermarkMargin.value
            );


        const position =
            calculateWatermarkPosition(
                imageWidth,
                imageHeight,
                watermarkWidth,
                watermarkHeight,
                margin
            );


        // -----------------------------------------------------
        // Opacity
        // -----------------------------------------------------

        const opacity =
            Number(
                watermarkOpacity.value
            ) / 100;


        context.save();


        context.globalAlpha =
            opacity;


        context.drawImage(
            watermarkImage,
            position.x,
            position.y,
            watermarkWidth,
            watermarkHeight
        );


        context.restore();


        // -----------------------------------------------------
        // Output
        // -----------------------------------------------------

        const format =
            watermarkOutputFormat.value;


        const mimeType =
            getMimeType(format);


        const quality =
            format === "png"
                ? undefined
                : 0.92;


        const blob =
            await canvasToBlob(
                canvas,
                mimeType,
                quality
            );


        if (!blob) {

            throw new Error(
                "Unable to create the watermarked image."
            );
        }


        const imageUrl =
            URL.createObjectURL(blob);


        return {
            blob,
            imageUrl,
            width: imageWidth,
            height: imageHeight,
            size: blob.size,
            fileName:
                buildOutputFileName(format),
            contentType: mimeType
        };

    }


    // =========================================================
    // CANVAS TO BLOB
    // =========================================================

    function canvasToBlob(
        canvas,
        mimeType,
        quality
    ) {

        return new Promise(
            resolve => {

                canvas.toBlob(
                    blob => {

                        resolve(blob);

                    },
                    mimeType,
                    quality
                );

            }
        );

    }


    // =========================================================
    // SHOW RESULT
    // =========================================================

    function showWatermarkResult(
        result
    ) {

        if (!result) {
            return;
        }


        watermarkResultImage.src =
            result.imageUrl;


        watermarkResultFileName.textContent =
            result.fileName;


        watermarkResultWidth.textContent =
            `${result.width} px`;


        watermarkResultHeight.textContent =
            `${result.height} px`;


        watermarkResultSize.textContent =
            formatFileSize(
                result.size
            );


        watermarkResultSection.hidden =
            false;


        resultSectionScroll();

    }


    // =========================================================
    // DOWNLOAD
    // =========================================================

    watermarkDownloadButton.addEventListener(
        "click",
        () => {

            if (!currentResult) {

                showMessage(
                    "There is no watermarked image to download.",
                    true
                );

                return;
            }


            try {

                const link =
                    document.createElement(
                        "a"
                    );


                link.href =
                    currentResult.imageUrl;


                link.download =
                    currentResult.fileName;


                document.body.appendChild(
                    link
                );


                link.click();


                link.remove();

            }
            catch (error) {

                console.error(
                    "Watermark download error:",
                    error
                );


                showMessage(
                    "Unable to download the image.",
                    true
                );

            }

        }
    );


    // =========================================================
    // ANOTHER IMAGE
    // =========================================================

    watermarkAnotherButton.addEventListener(
        "click",
        () => {

            resetEverything();

            watermarkImageInput.click();

        }
    );


    // =========================================================
    // CHANGE IMAGE
    // =========================================================

    watermarkClearImage.addEventListener(
        "click",
        () => {

            watermarkImageInput.click();

        }
    );


    // =========================================================
    // RESET SETTINGS
    // =========================================================

    watermarkResetButton.addEventListener(
        "click",
        () => {

            watermarkOpacity.value =
                "50";


            watermarkOpacityValue.textContent =
                "50%";


            watermarkScale.value =
                "25";


            watermarkScaleValue.textContent =
                "25%";


            watermarkMargin.value =
                "20";


            watermarkMarginValue.textContent =
                "20 px";


            watermarkOutputFormat.value =
                "jpeg";


            selectedPosition =
                "center";


            watermarkPositionButtons.forEach(
                button => {

                    button.classList.remove(
                        "active"
                    );


                    if (
                        button.dataset.position ===
                        "center"
                    ) {

                        button.classList.add(
                            "active"
                        );

                    }

                }
            );


            drawPreview();

        }
    );


    // =========================================================
    // RESET EVERYTHING
    // =========================================================

    function resetEverything() {

        if (imageObjectUrl) {

            URL.revokeObjectURL(
                imageObjectUrl
            );

            imageObjectUrl =
                null;

        }


        if (watermarkObjectUrl) {

            URL.revokeObjectURL(
                watermarkObjectUrl
            );

            watermarkObjectUrl =
                null;

        }


        selectedImageFile =
            null;


        selectedWatermarkFile =
            null;


        mainImage =
            null;


        watermarkImage =
            null;


        currentResult =
            null;


        watermarkImageInput.value =
            "";


        watermarkOverlayInput.value =
            "";


        watermarkImageInfo.textContent =
            "Select an image.";


        watermarkOverlayInfo.textContent =
            "No watermark selected.";


        watermarkResultImage.removeAttribute(
            "src"
        );


        watermarkWorkspace.hidden =
            true;


        watermarkResultSection.hidden =
            true;


        ctx.clearRect(
            0,
            0,
            watermarkCanvas.width,
            watermarkCanvas.height
        );

    }


    // =========================================================
    // WINDOW RESIZE
    // =========================================================

    window.addEventListener(
        "resize",
        () => {

            if (!mainImage) {
                return;
            }

            drawPreview();

        }
    );


    // =========================================================
    // HELPERS
    // =========================================================

    function isSupportedImage(file) {

        if (!file) {
            return false;
        }


        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];


        return allowedTypes.includes(
            file.type
        );

    }


    function getMimeType(format) {

        switch (format) {

            case "png":
                return "image/png";

            case "webp":
                return "image/webp";

            case "jpeg":
            default:
                return "image/jpeg";

        }

    }


    function buildOutputFileName(
        format
    ) {

        if (!selectedImageFile) {

            return `watermarked-image.${format}`;

        }


        const originalName =
            selectedImageFile.name;


        const dotIndex =
            originalName.lastIndexOf(
                "."
            );


        const baseName =
            dotIndex > 0
                ? originalName.substring(
                    0,
                    dotIndex
                )
                : originalName;


        return (
            baseName +
            "-watermarked." +
            format
        );

    }


    function formatFileSize(bytes) {

        if (
            !bytes ||
            bytes <= 0
        ) {

            return "0 Bytes";

        }


        const units = [
            "Bytes",
            "KB",
            "MB",
            "GB"
        ];


        const index =
            Math.min(
                Math.floor(
                    Math.log(bytes) /
                    Math.log(1024)
                ),
                units.length - 1
            );


        const value =
            bytes /
            Math.pow(
                1024,
                index
            );


        return (
            parseFloat(
                value.toFixed(2)
            ) +
            " " +
            units[index]
        );

    }


    function resultSectionScroll() {

        watermarkResultSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }


    function showMessage(
        message,
        isError = false
    ) {

        const existing =
            document.querySelector(
                ".image-forge-message"
            );


        if (existing) {
            existing.remove();
        }


        const element =
            document.createElement(
                "div"
            );


        element.className =
            "image-forge-message" +
            (
                isError
                    ? " error"
                    : ""
            );


        element.textContent =
            message;


        document.body.appendChild(
            element
        );


        setTimeout(
            () => {

                element.classList.add(
                    "hide"
                );


                setTimeout(
                    () => {

                        element.remove();

                    },
                    300
                );

            },
            3500
        );

    }


    // =========================================================
    // INITIAL STATE
    // =========================================================

    watermarkWorkspace.hidden =
        true;


    watermarkResultSection.hidden =
        true;


    watermarkOpacityValue.textContent =
        `${watermarkOpacity.value}%`;


    watermarkScaleValue.textContent =
        `${watermarkScale.value}%`;


    watermarkMarginValue.textContent =
        `${watermarkMargin.value} px`;

});