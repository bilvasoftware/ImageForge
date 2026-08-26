document.addEventListener("DOMContentLoaded", () => {

    // =========================================================
    // DOM
    // =========================================================

    const imageInput = document.getElementById("cropImageInput");
    const uploadZone = document.getElementById("cropUploadZone");
    const workspace = document.getElementById("cropWorkspace");
    const cropImage = document.getElementById("cropImage");
    const cropImageContainer = document.getElementById("cropImageContainer");
    const cropImageInfo = document.getElementById("cropImageInfo");

    const clearImage = document.getElementById("cropClearImage");

    const cropWidth = document.getElementById("cropWidth");
    const cropHeight = document.getElementById("cropHeight");

    const outputFormat = document.getElementById("cropOutputFormat");

    const resetButton = document.getElementById("cropResetButton");
    const cropButton = document.getElementById("cropButton");

    const resultSection = document.getElementById("cropResultSection");
    const resultImage = document.getElementById("cropResultImage");
    const resultFileName = document.getElementById("cropResultFileName");

    const originalFormat = document.getElementById("cropOriginalFormat");
    const convertedFormat = document.getElementById("cropConvertedFormat");

    const resultWidth = document.getElementById("cropResultWidth");
    const resultHeight = document.getElementById("cropResultHeight");
    const resultSize = document.getElementById("cropResultSize");

    const downloadButton = document.getElementById("cropDownloadButton");
    const anotherButton = document.getElementById("cropAnotherButton");

    const ratioButtons =
        document.querySelectorAll(".cropper-ratio-button");


    // =========================================================
    // SAFETY CHECK
    // =========================================================

    if (
        !imageInput ||
        !uploadZone ||
        !workspace ||
        !cropImage ||
        !cropImageContainer ||
        !cropImageInfo ||
        !clearImage ||
        !cropWidth ||
        !cropHeight ||
        !outputFormat ||
        !resetButton ||
        !cropButton ||
        !resultSection ||
        !resultImage ||
        !resultFileName ||
        !originalFormat ||
        !convertedFormat ||
        !resultWidth ||
        !resultHeight ||
        !resultSize ||
        !downloadButton ||
        !anotherButton
    ) {
        console.error(
            "ImageForge Cropper: Required DOM elements are missing."
        );
        return;
    }


    // =========================================================
    // STATE
    // =========================================================

    let selectedFile = null;
    let imageObjectUrl = null;

    let naturalWidth = 0;
    let naturalHeight = 0;

    let crop = {
        x: 0,
        y: 0,
        width: 0,
        height: 0
    };

    let currentRatio = null;

    let dragging = false;
    let resizing = false;
    let resizeHandle = null;

    let dragStartX = 0;
    let dragStartY = 0;

    let initialCrop = null;
    let activePointerId = null;

    let cropResult = null;


    // =========================================================
    // FILE INPUT
    // =========================================================

    imageInput.addEventListener("change", event => {

        const files = Array.from(
            event.target.files || []
        );

        if (!files.length) {
            return;
        }

        loadImage(files[0]);
    });


    // =========================================================
    // DRAG & DROP
    // =========================================================

    ["dragenter", "dragover"].forEach(eventName => {

        uploadZone.addEventListener(eventName, event => {

            event.preventDefault();
            event.stopPropagation();

            uploadZone.classList.add("drag-active");
        });

    });


    ["dragleave", "drop"].forEach(eventName => {

        uploadZone.addEventListener(eventName, event => {

            event.preventDefault();
            event.stopPropagation();

            uploadZone.classList.remove("drag-active");
        });

    });


    uploadZone.addEventListener("drop", event => {

        const files = Array.from(
            event.dataTransfer.files || []
        );

        if (!files.length) {
            return;
        }

        loadImage(files[0]);
    });


    // =========================================================
    // LOAD IMAGE
    // =========================================================

    function loadImage(file) {

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.type)) {

            showMessage(
                "Please select a JPG, PNG, or WEBP image.",
                true
            );

            return;
        }

        selectedFile = file;

        if (imageObjectUrl) {
            URL.revokeObjectURL(imageObjectUrl);
        }

        imageObjectUrl = URL.createObjectURL(file);

        cropImage.onload = () => {

            naturalWidth = cropImage.naturalWidth;
            naturalHeight = cropImage.naturalHeight;

            cropImageInfo.textContent =
                `${naturalWidth} × ${naturalHeight}px • ${formatFileSize(file.size)}`;

            workspace.hidden = false;
            resultSection.hidden = true;

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    initializeCrop();
                });
            });
        };

        cropImage.onerror = () => {

            showMessage(
                "Unable to load this image.",
                true
            );
        };

        cropImage.src = imageObjectUrl;
    }


    // =========================================================
    // GET DISPLAYED IMAGE RECT
    // =========================================================

    function getDisplayedImageRect() {

        const imageRect =
            cropImage.getBoundingClientRect();

        const containerRect =
            cropImageContainer.getBoundingClientRect();


        if (
            imageRect.width <= 0 ||
            imageRect.height <= 0
        ) {

            return {
                left: 0,
                top: 0,
                width: 0,
                height: 0
            };

        }


        return {
            left:
                imageRect.left -
                containerRect.left,

            top:
                imageRect.top -
                containerRect.top,

            width:
                imageRect.width,

            height:
                imageRect.height
        };

    }

    // =========================================================
    // INITIALIZE CROP
    // =========================================================

    function initializeCrop() {

        const imageRect =
            getDisplayedImageRect();

        if (
            imageRect.width <= 0 ||
            imageRect.height <= 0
        ) {
            return;
        }

        let width =
            imageRect.width * 0.85;

        let height =
            imageRect.height * 0.85;


        // Apply selected aspect ratio

        if (currentRatio !== null) {

            if (width / height > currentRatio) {
                width = height * currentRatio;
            }
            else {
                height = width / currentRatio;
            }
        }


        width = Math.min(
            width,
            imageRect.width
        );

        height = Math.min(
            height,
            imageRect.height
        );


        crop.width = Math.max(
            10,
            width
        );

        crop.height = Math.max(
            10,
            height
        );

        crop.x =
            (imageRect.width - crop.width) / 2;

        crop.y =
            (imageRect.height - crop.height) / 2;


        updateCropDisplay();
    }


    // =========================================================
    // UPDATE CROP DISPLAY
    // =========================================================

    function updateCropDisplay() {

        const imageRect =
            getDisplayedImageRect();

        if (
            imageRect.width <= 0 ||
            imageRect.height <= 0
        ) {
            return;
        }


        // -----------------------------------------
        // Clamp display crop
        // -----------------------------------------

        crop.width = Math.max(
            10,
            Math.min(
                crop.width,
                imageRect.width
            )
        );

        crop.height = Math.max(
            10,
            Math.min(
                crop.height,
                imageRect.height
            )
        );

        crop.x = Math.max(
            0,
            Math.min(
                crop.x,
                imageRect.width - crop.width
            )
        );

        crop.y = Math.max(
            0,
            Math.min(
                crop.y,
                imageRect.height - crop.height
            )
        );


        // -----------------------------------------
        // Selection element
        // -----------------------------------------

        let selection =
            document.getElementById("cropSelection");


        if (!selection) {

            selection =
                document.createElement("div");

            selection.id =
                "cropSelection";

            selection.className =
                "crop-selection";


            selection.innerHTML = `
                <div class="crop-selection-shade"></div>

                <div
                    class="crop-handle crop-handle-nw"
                    data-handle="nw">
                </div>

                <div
                    class="crop-handle crop-handle-ne"
                    data-handle="ne">
                </div>

                <div
                    class="crop-handle crop-handle-sw"
                    data-handle="sw">
                </div>

                <div
                    class="crop-handle crop-handle-se"
                    data-handle="se">
                </div>
            `;


            cropImageContainer.appendChild(
                selection
            );

            attachCropSelectionEvents(
                selection
            );
        }


        selection.style.left =
            `${imageRect.left + crop.x}px`;

        selection.style.top =
            `${imageRect.top + crop.y}px`;

        selection.style.width =
            `${crop.width}px`;

        selection.style.height =
            `${crop.height}px`;


        updateCropDimensions(
            imageRect
        );
    }


    // =========================================================
    // SELECTION EVENTS
    // =========================================================

    function attachCropSelectionEvents(selection) {

        selection.addEventListener(
            "pointerdown",
            event => {

                const handle =
                    event.target.closest(
                        ".crop-handle"
                    );


                if (handle) {

                    event.preventDefault();

                    startResize(
                        event,
                        handle.dataset.handle
                    );

                    return;
                }


                event.preventDefault();

                startDrag(event);
            }
        );
    }


    // =========================================================
    // DRAG
    // =========================================================

    function startDrag(event) {

        dragging = true;
        resizing = false;

        activePointerId =
            event.pointerId;

        dragStartX =
            event.clientX;

        dragStartY =
            event.clientY;

        initialCrop = {
            x: crop.x,
            y: crop.y,
            width: crop.width,
            height: crop.height
        };


        document.addEventListener(
            "pointermove",
            handlePointerMove
        );

        document.addEventListener(
            "pointerup",
            stopPointerAction
        );

        document.body.style.userSelect =
            "none";
    }


    // =========================================================
    // RESIZE
    // =========================================================

    function startResize(event, handle) {

        resizing = true;
        dragging = false;

        resizeHandle =
            handle;

        activePointerId =
            event.pointerId;

        dragStartX =
            event.clientX;

        dragStartY =
            event.clientY;

        initialCrop = {
            x: crop.x,
            y: crop.y,
            width: crop.width,
            height: crop.height
        };


        document.addEventListener(
            "pointermove",
            handlePointerMove
        );

        document.addEventListener(
            "pointerup",
            stopPointerAction
        );

        document.body.style.userSelect =
            "none";
    }


    // =========================================================
    // POINTER MOVE
    // =========================================================

    function handlePointerMove(event) {

        if (
            !dragging &&
            !resizing
        ) {
            return;
        }

        if (
            activePointerId !== null &&
            event.pointerId !== activePointerId
        ) {
            return;
        }


        const imageRect =
            getDisplayedImageRect();


        if (
            imageRect.width <= 0 ||
            imageRect.height <= 0
        ) {
            return;
        }


        const deltaX =
            event.clientX - dragStartX;

        const deltaY =
            event.clientY - dragStartY;


        if (dragging) {

            crop.x =
                initialCrop.x + deltaX;

            crop.y =
                initialCrop.y + deltaY;


            crop.x = Math.max(
                0,
                Math.min(
                    crop.x,
                    imageRect.width - crop.width
                )
            );

            crop.y = Math.max(
                0,
                Math.min(
                    crop.y,
                    imageRect.height - crop.height
                )
            );
        }


        if (resizing) {

            resizeCrop(
                deltaX,
                deltaY,
                imageRect
            );
        }


        updateCropDisplay();
    }


    // =========================================================
    // RESIZE CROP
    // =========================================================

    function resizeCrop(
        deltaX,
        deltaY,
        imageRect
    ) {

        const original =
            initialCrop;

        let x = original.x;
        let y = original.y;

        let width =
            original.width;

        let height =
            original.height;


        const minSize = 20;


        switch (resizeHandle) {

            case "se":

                width =
                    original.width + deltaX;

                height =
                    original.height + deltaY;

                break;


            case "sw":

                width =
                    original.width - deltaX;

                height =
                    original.height + deltaY;

                x =
                    original.x + deltaX;

                break;


            case "ne":

                width =
                    original.width + deltaX;

                height =
                    original.height - deltaY;

                y =
                    original.y + deltaY;

                break;


            case "nw":

                width =
                    original.width - deltaX;

                height =
                    original.height - deltaY;

                x =
                    original.x + deltaX;

                y =
                    original.y + deltaY;

                break;
        }


        // -----------------------------------------
        // Aspect ratio
        // -----------------------------------------

        if (currentRatio !== null) {

            if (
                Math.abs(deltaX) >=
                Math.abs(deltaY)
            ) {

                height =
                    width / currentRatio;
            }
            else {

                width =
                    height * currentRatio;
            }


            if (
                resizeHandle === "nw" ||
                resizeHandle === "ne"
            ) {

                y =
                    original.y +
                    original.height -
                    height;
            }


            if (
                resizeHandle === "nw" ||
                resizeHandle === "sw"
            ) {

                x =
                    original.x +
                    original.width -
                    width;
            }
        }


        // -----------------------------------------
        // Minimum
        // -----------------------------------------

        width =
            Math.max(
                minSize,
                width
            );

        height =
            Math.max(
                minSize,
                height
            );


        // -----------------------------------------
        // Keep inside image
        // -----------------------------------------

        if (x < 0) {

            if (
                resizeHandle === "nw" ||
                resizeHandle === "sw"
            ) {

                width += x;
            }

            x = 0;
        }


        if (y < 0) {

            if (
                resizeHandle === "nw" ||
                resizeHandle === "ne"
            ) {

                height += y;
            }

            y = 0;
        }


        if (
            x + width >
            imageRect.width
        ) {

            width =
                imageRect.width - x;
        }


        if (
            y + height >
            imageRect.height
        ) {

            height =
                imageRect.height - y;
        }


        // -----------------------------------------
        // Final ratio correction
        // -----------------------------------------

        if (currentRatio !== null) {

            if (
                width / height >
                currentRatio
            ) {

                width =
                    height * currentRatio;
            }
            else {

                height =
                    width / currentRatio;
            }


            if (
                resizeHandle === "nw" ||
                resizeHandle === "sw"
            ) {

                x =
                    original.x +
                    original.width -
                    width;
            }


            if (
                resizeHandle === "nw" ||
                resizeHandle === "ne"
            ) {

                y =
                    original.y +
                    original.height -
                    height;
            }
        }


        // -----------------------------------------
        // Final clamp
        // -----------------------------------------

        width =
            Math.min(
                width,
                imageRect.width
            );

        height =
            Math.min(
                height,
                imageRect.height
            );

        x =
            Math.max(
                0,
                Math.min(
                    x,
                    imageRect.width - width
                )
            );

        y =
            Math.max(
                0,
                Math.min(
                    y,
                    imageRect.height - height
                )
            );


        crop.x = x;
        crop.y = y;
        crop.width = width;
        crop.height = height;
    }


    // =========================================================
    // STOP POINTER
    // =========================================================

    function stopPointerAction() {

        dragging = false;
        resizing = false;

        resizeHandle = null;
        activePointerId = null;
        initialCrop = null;

        document.removeEventListener(
            "pointermove",
            handlePointerMove
        );

        document.removeEventListener(
            "pointerup",
            stopPointerAction
        );

        document.body.style.userSelect = "";
    }


    // =========================================================
    // CONVERT DISPLAY CROP -> NATURAL IMAGE
    // =========================================================

    function getCropPixelDimensions() {

        const imageRect =
            getDisplayedImageRect();


        if (
            imageRect.width <= 0 ||
            imageRect.height <= 0 ||
            naturalWidth <= 0 ||
            naturalHeight <= 0
        ) {

            return {
                x: 0,
                y: 0,
                width: 0,
                height: 0
            };

        }


        // =====================================================
        // DISPLAY -> NATURAL IMAGE SCALE
        // =====================================================

        const scaleX =
            naturalWidth /
            imageRect.width;

        const scaleY =
            naturalHeight /
            imageRect.height;


        // =====================================================
        // CONVERT TO NATURAL IMAGE COORDINATES
        // =====================================================

        let cropX =
            Math.round(
                crop.x * scaleX
            );

        let cropY =
            Math.round(
                crop.y * scaleY
            );

        let cropW =
            Math.round(
                crop.width * scaleX
            );

        let cropH =
            Math.round(
                crop.height * scaleY
            );


        // =====================================================
        // HARD CLAMP TO SOURCE IMAGE
        // =====================================================

        cropX = Math.max(
            0,
            Math.min(
                cropX,
                naturalWidth - 1
            )
        );

        cropY = Math.max(
            0,
            Math.min(
                cropY,
                naturalHeight - 1
            )
        );


        // Width/height must completely fit
        // inside the source image.

        cropW = Math.min(
            cropW,
            naturalWidth - cropX
        );

        cropH = Math.min(
            cropH,
            naturalHeight - cropY
        );


        // =====================================================
        // FINAL VALIDATION
        // =====================================================

        if (
            !Number.isFinite(cropX) ||
            !Number.isFinite(cropY) ||
            !Number.isFinite(cropW) ||
            !Number.isFinite(cropH)
        ) {

            console.error(
                "ImageForge: Invalid crop dimensions.",
                {
                    cropX,
                    cropY,
                    cropW,
                    cropH,
                    naturalWidth,
                    naturalHeight
                }
            );

            return {
                x: 0,
                y: 0,
                width: 0,
                height: 0
            };
        }


        if (
            cropW < 1 ||
            cropH < 1
        ) {

            console.error(
                "ImageForge: Crop area is too small.",
                {
                    cropX,
                    cropY,
                    cropW,
                    cropH
                }
            );

            return {
                x: 0,
                y: 0,
                width: 0,
                height: 0
            };
        }


        // =====================================================
        // FINAL BOUNDARY CHECK
        // =====================================================

        if (
            cropX + cropW >
            naturalWidth
        ) {

            cropW =
                naturalWidth -
                cropX;
        }


        if (
            cropY + cropH >
            naturalHeight
        ) {

            cropH =
                naturalHeight -
                cropY;
        }


        if (
            cropW < 1 ||
            cropH < 1
        ) {

            console.error(
                "ImageForge: Crop area is outside the image."
            );

            return {
                x: 0,
                y: 0,
                width: 0,
                height: 0
            };
        }


        // =====================================================
        // DEBUG
        // =====================================================

        console.log(
            "ImageForge: Final Crop Request",
            {
                sourceWidth: naturalWidth,
                sourceHeight: naturalHeight,
                x: cropX,
                y: cropY,
                width: cropW,
                height: cropH
            }
        );


        return {
            x: cropX,
            y: cropY,
            width: cropW,
            height: cropH
        };
    }


    function updateCropDimensions(imageRect) {

        if (
            naturalWidth <= 0 ||
            naturalHeight <= 0
        ) {
            return;
        }


        const dimensions =
            getCropPixelDimensions();


        cropWidth.textContent =
            `${dimensions.width} px`;

        cropHeight.textContent =
            `${dimensions.height} px`;
    }


    // =========================================================
    // ASPECT RATIO BUTTONS
    // =========================================================

    ratioButtons.forEach(button => {

        button.addEventListener("click", () => {

            const ratio =
                button.dataset.ratio;


            if (ratio === "free") {

                currentRatio = null;
            }
            else {

                currentRatio =
                    Number(ratio);
            }


            ratioButtons.forEach(item => {

                item.classList.remove(
                    "active"
                );
            });


            button.classList.add(
                "active"
            );


            applyAspectRatio();
        });

    });


    // =========================================================
    // APPLY ASPECT RATIO
    // =========================================================

    function applyAspectRatio() {

        if (currentRatio === null) {

            updateCropDisplay();

            return;
        }


        const imageRect =
            getDisplayedImageRect();


        if (
            imageRect.width <= 0 ||
            imageRect.height <= 0
        ) {
            return;
        }


        let width =
            crop.width;

        let height =
            width / currentRatio;


        if (
            height >
            imageRect.height
        ) {

            height =
                imageRect.height;

            width =
                height * currentRatio;
        }


        if (
            width >
            imageRect.width
        ) {

            width =
                imageRect.width;

            height =
                width / currentRatio;
        }


        crop.width = width;
        crop.height = height;


        crop.x = Math.max(
            0,
            Math.min(
                crop.x,
                imageRect.width - crop.width
            )
        );

        crop.y = Math.max(
            0,
            Math.min(
                crop.y,
                imageRect.height - crop.height
            )
        );


        updateCropDisplay();
    }

    // =========================================================
    // CROP IMAGE
    // =========================================================

    cropButton.addEventListener(
        "click",
        async () => {

            if (!selectedFile) {

                showMessage(
                    "Please select an image first.",
                    true
                );

                return;
            }


            if (
                naturalWidth <= 0 ||
                naturalHeight <= 0
            ) {

                showMessage(
                    "The image is not ready yet.",
                    true
                );

                return;
            }


            // =================================================
            // CONVERT DISPLAY CROP -> NATURAL IMAGE
            // =================================================

            const dimensions =
                getCropPixelDimensions();


            const cropX =
                dimensions.x;

            const cropY =
                dimensions.y;

            const cropW =
                dimensions.width;

            const cropH =
                dimensions.height;


            // =================================================
            // FINAL VALIDATION
            // =================================================

            if (
                !Number.isFinite(cropX) ||
                !Number.isFinite(cropY) ||
                !Number.isFinite(cropW) ||
                !Number.isFinite(cropH)
            ) {

                showMessage(
                    "Invalid crop dimensions.",
                    true
                );

                return;
            }


            if (
                cropW < 1 ||
                cropH < 1
            ) {

                showMessage(
                    "Please select a valid crop area.",
                    true
                );

                return;
            }


            if (
                cropX < 0 ||
                cropY < 0 ||
                cropX + cropW > naturalWidth ||
                cropY + cropH > naturalHeight
            ) {

                console.error(
                    "ImageForge: Crop exceeds source image.",
                    {
                        naturalWidth,
                        naturalHeight,
                        x: cropX,
                        y: cropY,
                        width: cropW,
                        height: cropH
                    }
                );

                showMessage(
                    "The selected crop area is outside the image.",
                    true
                );

                return;
            }


            // =================================================
            // DEBUG
            // =================================================

            console.log(
                "ImageForge: Final Crop Request",
                {
                    sourceWidth: naturalWidth,
                    sourceHeight: naturalHeight,
                    x: cropX,
                    y: cropY,
                    width: cropW,
                    height: cropH
                }
            );


            // =================================================
            // DISABLE BUTTON
            // =================================================

            cropButton.disabled = true;


            const originalButtonText =
                cropButton.innerHTML;


            cropButton.innerHTML = `
            <span>⏳</span>
            Cropping...
        `;


            // =================================================
            // SEND REQUEST
            // =================================================

            const formData =
                new FormData();


            formData.append(
                "file",
                selectedFile
            );


            formData.append(
                "x",
                String(cropX)
            );


            formData.append(
                "y",
                String(cropY)
            );


            formData.append(
                "width",
                String(cropW)
            );


            formData.append(
                "height",
                String(cropH)
            );


            formData.append(
                "outputFormat",
                outputFormat.value
            );


            try {

                const response =
                    await fetch(
                        "/Cropper/Crop",
                        {
                            method: "POST",
                            body: formData
                        }
                    );


                if (!response.ok) {

                    const errorText =
                        await response.text();


                    console.error(
                        "Crop server response:",
                        errorText
                    );


                    throw new Error(
                        errorText ||
                        "Cropping failed."
                    );
                }


                const result =
                    await response.json();


                if (!result) {

                    throw new Error(
                        "No cropped image was returned."
                    );
                }


                cropResult =
                    result;


                showCropResult(
                    result
                );

            }
            catch (error) {

                console.error(
                    "Crop error:",
                    error
                );


                showMessage(
                    error.message ||
                    "Cropping failed. Please try again.",
                    true
                );

            }
            finally {

                cropButton.disabled =
                    false;


                cropButton.innerHTML =
                    originalButtonText;
            }

        }
    );
    
  


    // =========================================================
    // SHOW RESULT
    // =========================================================

    function showCropResult(result) {

        const data =
            result.data ||
            result.base64Data ||
            result.imageData;


        if (!data) {

            throw new Error(
                "The server returned an invalid image."
            );
        }


        const contentType =
            result.contentType ||
            `image/${outputFormat.value}`;


        const imageSource =
            data.startsWith("data:")
                ? data
                : `data:${contentType};base64,${data}`;


        resultImage.src =
            imageSource;


        resultFileName.textContent =
            result.fileName ||
            buildOutputFileName();


        originalFormat.textContent =
            normalizeFormat(
                result.originalFormat ||
                getFileExtension(
                    selectedFile.name
                )
            );


        convertedFormat.textContent =
            normalizeFormat(
                result.outputFormat ||
                outputFormat.value
            );


        const dimensions =
            getCropPixelDimensions();


        resultWidth.textContent =
            `${Number(
                result.width ||
                dimensions.width
            )} px`;


        resultHeight.textContent =
            `${Number(
                result.height ||
                dimensions.height
            )} px`;


        resultSize.textContent =
            formatFileSize(
                Number(
                    result.fileSize ||
                    result.size ||
                    estimateBase64Size(data)
                )
            );


        resultSection.hidden =
            false;


        resultSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }


    // =========================================================
    // DOWNLOAD
    // =========================================================

    downloadButton.addEventListener(
        "click",
        () => {

            if (!cropResult) {

                showMessage(
                    "There is no cropped image to download.",
                    true
                );

                return;
            }


            const data =
                cropResult.data ||
                cropResult.base64Data ||
                cropResult.imageData;


            if (!data) {

                showMessage(
                    "The cropped image data is unavailable.",
                    true
                );

                return;
            }


            try {

                const contentType =
                    cropResult.contentType ||
                    `image/${outputFormat.value}`;


                const cleanBase64 =
                    data.startsWith("data:")
                        ? data.split(",")[1]
                        : data;


                const byteCharacters =
                    atob(cleanBase64);


                const byteArray =
                    new Uint8Array(
                        byteCharacters.length
                    );


                for (
                    let i = 0;
                    i < byteCharacters.length;
                    i++
                ) {

                    byteArray[i] =
                        byteCharacters.charCodeAt(i);
                }


                const blob =
                    new Blob(
                        [byteArray],
                        {
                            type: contentType
                        }
                    );


                const url =
                    URL.createObjectURL(blob);


                const link =
                    document.createElement("a");


                link.href = url;

                link.download =
                    cropResult.fileName ||
                    buildOutputFileName();


                document.body.appendChild(link);

                link.click();

                link.remove();


                setTimeout(() => {

                    URL.revokeObjectURL(url);

                }, 1000);
            }
            catch (error) {

                console.error(
                    "Crop download error:",
                    error
                );


                showMessage(
                    "Unable to download the cropped image.",
                    true
                );
            }
        }
    );


    // =========================================================
    // ANOTHER IMAGE
    // =========================================================

    anotherButton.addEventListener(
        "click",
        () => {

            resetCropper();

            imageInput.click();
        }
    );


    // =========================================================
    // RESET
    // =========================================================

    resetButton.addEventListener(
        "click",
        () => {

            initializeCrop();
        }
    );


    // =========================================================
    // CLEAR
    // =========================================================

    clearImage.addEventListener(
        "click",
        () => {

            resetCropper();
        }
    );


    // =========================================================
    // RESET EVERYTHING
    // =========================================================

    function resetCropper() {

        stopPointerAction();


        selectedFile = null;

        naturalWidth = 0;
        naturalHeight = 0;

        cropResult = null;


        crop = {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        };


        if (imageObjectUrl) {

            URL.revokeObjectURL(
                imageObjectUrl
            );

            imageObjectUrl = null;
        }


        cropImage.removeAttribute("src");

        imageInput.value = "";


        workspace.hidden = true;
        resultSection.hidden = true;


        cropImageInfo.textContent =
            "Select the area you want to keep.";


        cropWidth.textContent =
            "0 px";

        cropHeight.textContent =
            "0 px";


        const selection =
            document.getElementById(
                "cropSelection"
            );


        if (selection) {
            selection.remove();
        }


        currentRatio = null;


        ratioButtons.forEach(button => {

            button.classList.remove(
                "active"
            );


            if (
                button.dataset.ratio === "free"
            ) {

                button.classList.add(
                    "active"
                );
            }
        });
    }


    // =========================================================
    // WINDOW RESIZE
    // =========================================================

    let lastImageRect = null;


    window.addEventListener(
        "resize",
        () => {

            if (
                workspace.hidden ||
                !selectedFile
            ) {
                return;
            }


            const newRect =
                getDisplayedImageRect();


            if (
                newRect.width <= 0 ||
                newRect.height <= 0
            ) {
                return;
            }


            if (!lastImageRect) {

                lastImageRect = {
                    width: newRect.width,
                    height: newRect.height
                };

                updateCropDisplay();

                return;
            }


            const xRatio =
                crop.x /
                lastImageRect.width;

            const yRatio =
                crop.y /
                lastImageRect.height;

            const widthRatio =
                crop.width /
                lastImageRect.width;

            const heightRatio =
                crop.height /
                lastImageRect.height;


            crop.x =
                newRect.width * xRatio;

            crop.y =
                newRect.height * yRatio;

            crop.width =
                newRect.width * widthRatio;

            crop.height =
                newRect.height * heightRatio;


            lastImageRect = {
                width: newRect.width,
                height: newRect.height
            };


            updateCropDisplay();
        }
    );


    // =========================================================
    // HELPERS
    // =========================================================

    function buildOutputFileName() {

        if (!selectedFile) {
            return "cropped-image.webp";
        }


        const originalName =
            selectedFile.name;


        const dotIndex =
            originalName.lastIndexOf(".");


        const baseName =
            dotIndex > 0
                ? originalName.substring(
                    0,
                    dotIndex
                )
                : originalName;


        return (
            baseName +
            "-cropped." +
            outputFormat.value
        );
    }


    function getFileExtension(fileName) {

        if (!fileName) {
            return "";
        }


        const parts =
            fileName.split(".");


        return parts.length > 1
            ? parts.pop()
            : "";
    }


    function normalizeFormat(format) {

        if (!format) {
            return "";
        }


        return String(format)
            .replace("image/", "")
            .toUpperCase();
    }


    function estimateBase64Size(base64) {

        if (!base64) {
            return 0;
        }


        const cleanData =
            base64.includes(",")
                ? base64.split(",")[1]
                : base64;


        return Math.floor(
            cleanData.length * 0.75
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
            document.createElement("div");


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


        setTimeout(() => {

            element.classList.add("hide");


            setTimeout(() => {

                element.remove();

            }, 300);

        }, 3500);
    }


    // =========================================================
    // INITIAL STATE
    // =========================================================

    workspace.hidden = true;
    resultSection.hidden = true;

});