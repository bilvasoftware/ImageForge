document.addEventListener("DOMContentLoaded", () => {

    // =========================
    // DOM ELEMENTS
    // =========================

    const imageInput =
        document.getElementById("resizeImageInput");

    const uploadZone =
        document.getElementById("resizeUploadZone");

    const selectedSection =
        document.getElementById("resizeSelectedSection");

    const imageGrid =
        document.getElementById("resizeImageGrid");

    const imageCount =
        document.getElementById("resizeImageCount");

    const clearImages =
        document.getElementById("resizeClearImages");

    const dimensionsMode =
        document.getElementById("resizeDimensionsMode");

    const percentageMode =
        document.getElementById("resizePercentageMode");

    const dimensionsSettings =
        document.getElementById("resizeDimensionsSettings");

    const percentageSettings =
        document.getElementById("resizePercentageSettings");

    const widthInput =
        document.getElementById("resizeWidth");

    const heightInput =
        document.getElementById("resizeHeight");

    const keepAspect =
        document.getElementById("resizeKeepAspect");

    const percentageInput =
        document.getElementById("resizePercentage");

    const outputFormat =
        document.getElementById("resizeOutputFormat");

    const resizeQuality =
        document.getElementById("resizeQuality");

    const resizeQualityValue =
        document.getElementById("resizeQualityValue");

    const resizeButton =
        document.getElementById("resizeButton");


    // =========================
    // SAFETY CHECK
    // =========================

    if (
        !imageInput ||
        !uploadZone ||
        !selectedSection ||
        !imageGrid ||
        !imageCount ||
        !clearImages ||
        !dimensionsMode ||
        !percentageMode ||
        !dimensionsSettings ||
        !percentageSettings ||
        !widthInput ||
        !heightInput ||
        !keepAspect ||
        !percentageInput ||
        !outputFormat ||
        !resizeQuality ||
        !resizeQualityValue ||
        !resizeButton
    ) {
        return;
    }


    // =========================
    // STATE
    // =========================

    let selectedFiles = [];

    let syncingAspectRatio = false;


    // =========================
    // FILE INPUT
    // =========================

    imageInput.addEventListener(
        "change",
        event => {

            addFiles(event.target.files);

        }
    );


    // =========================
    // DRAG EVENTS
    // =========================

    ["dragenter", "dragover"].forEach(
        eventName => {

            uploadZone.addEventListener(
                eventName,
                event => {

                    event.preventDefault();
                    event.stopPropagation();

                    uploadZone.classList.add(
                        "drag-active"
                    );

                }
            );

        }
    );


    ["dragleave", "drop"].forEach(
        eventName => {

            uploadZone.addEventListener(
                eventName,
                event => {

                    event.preventDefault();
                    event.stopPropagation();

                    uploadZone.classList.remove(
                        "drag-active"
                    );

                }
            );

        }
    );


    // =========================
    // DROP
    // =========================

    uploadZone.addEventListener(
        "drop",
        event => {

            event.preventDefault();

            addFiles(
                event.dataTransfer.files
            );

        }
    );


    // =========================
    // ADD FILES
    // =========================

    function addFiles(files) {

        const incomingFiles =
            Array.from(files || []);


        const validFiles =
            incomingFiles.filter(
                file => {

                    return (
                        file.type === "image/jpeg" ||
                        file.type === "image/png" ||
                        file.type === "image/webp"
                    );

                }
            );


        if (validFiles.length === 0) {

            showMessage(
                "Please select JPG, PNG, or WEBP images.",
                true
            );

            return;
        }


        const remainingSlots =
            20 - selectedFiles.length;


        if (remainingSlots <= 0) {

            showMessage(
                "You can select a maximum of 20 images.",
                true
            );

            return;
        }


        const filesToAdd =
            validFiles.slice(
                0,
                remainingSlots
            );


        if (
            validFiles.length >
            filesToAdd.length
        ) {

            showMessage(
                "Only 20 images can be selected.",
                true
            );

        }


        selectedFiles = [
            ...selectedFiles,
            ...filesToAdd
        ];


        renderImages();

    }


    // =========================
    // RENDER IMAGES
    // =========================

    function renderImages() {

        imageGrid.innerHTML = "";


        if (selectedFiles.length === 0) {

            selectedSection.hidden = true;

            return;
        }


        selectedSection.hidden = false;


        imageCount.textContent =
            `${selectedFiles.length} image${selectedFiles.length > 1 ? "s" : ""} selected`;


        selectedFiles.forEach(
            (file, index) => {

                const reader =
                    new FileReader();


                reader.onload =
                    event => {

                        const card =
                            document.createElement(
                                "div"
                            );


                        card.className =
                            "image-item";


                        card.innerHTML = `

                            <div class="resize-image-preview">

                                <img
                                    src="${event.target.result}"
                                    alt="Image preview"
                                />

                                <button
                                    type="button"
                                    class="resize-remove-image"
                                    data-index="${index}"
                                    aria-label="Remove image">

                                    ×

                                </button>

                            </div>

                            <div class="image-info">

                                <div class="image-name">
                                    ${escapeHtml(file.name)}
                                </div>

                                <div class="image-size">
                                    ${formatFileSize(file.size)}
                                </div>

                            </div>

                        `;


                        imageGrid.appendChild(
                            card
                        );


                        const removeButton =
                            card.querySelector(
                                ".resize-remove-image"
                            );


                        removeButton.addEventListener(
                            "click",
                            () => {

                                removeFile(index);

                            }
                        );

                    };


                reader.readAsDataURL(file);

            }
        );

    }


    // =========================
    // REMOVE FILE
    // =========================

    function removeFile(index) {

        selectedFiles.splice(
            index,
            1
        );


        imageInput.value = "";

        renderImages();

        removeResults();

    }


    // =========================
    // CLEAR
    // =========================

    clearImages.addEventListener(
        "click",
        () => {

            selectedFiles = [];

            imageInput.value = "";

            imageGrid.innerHTML = "";

            selectedSection.hidden = true;

            removeResults();

        }
    );


    // =========================
    // RESIZE MODE
    // =========================

    dimensionsMode.addEventListener(
        "change",
        updateResizeMode
    );


    percentageMode.addEventListener(
        "change",
        updateResizeMode
    );


    function updateResizeMode() {

        if (percentageMode.checked) {

            dimensionsSettings.hidden = true;

            percentageSettings.hidden = false;

        }
        else {

            dimensionsSettings.hidden = false;

            percentageSettings.hidden = true;

        }

    }


    // =========================
    // ASPECT RATIO
    // =========================

    widthInput.addEventListener(
        "input",
        () => {

            if (
                !keepAspect.checked ||
                syncingAspectRatio
            ) {
                return;
            }


            const firstFile =
                selectedFiles[0];


            if (!firstFile) {
                return;
            }


            getImageDimensions(
                firstFile,
                dimensions => {

                    if (
                        !dimensions ||
                        !dimensions.width ||
                        !dimensions.height
                    ) {
                        return;
                    }


                    const width =
                        parseInt(
                            widthInput.value,
                            10
                        );


                    if (
                        !width ||
                        width < 1
                    ) {
                        return;
                    }


                    const height =
                        Math.round(
                            width *
                            dimensions.height /
                            dimensions.width
                        );


                    syncingAspectRatio = true;

                    heightInput.value =
                        height;

                    syncingAspectRatio = false;

                }
            );

        }
    );


    heightInput.addEventListener(
        "input",
        () => {

            if (
                !keepAspect.checked ||
                syncingAspectRatio
            ) {
                return;
            }


            const firstFile =
                selectedFiles[0];


            if (!firstFile) {
                return;
            }


            getImageDimensions(
                firstFile,
                dimensions => {

                    if (
                        !dimensions ||
                        !dimensions.width ||
                        !dimensions.height
                    ) {
                        return;
                    }


                    const height =
                        parseInt(
                            heightInput.value,
                            10
                        );


                    if (
                        !height ||
                        height < 1
                    ) {
                        return;
                    }


                    const width =
                        Math.round(
                            height *
                            dimensions.width /
                            dimensions.height
                        );


                    syncingAspectRatio = true;

                    widthInput.value =
                        width;

                    syncingAspectRatio = false;

                }
            );

        }
    );


    // =========================
    // QUALITY
    // =========================

    resizeQuality.addEventListener(
        "input",
        () => {

            resizeQualityValue.textContent =
                `${resizeQuality.value}%`;

        }
    );


    // =========================
    // PERCENTAGE PRESETS
    // =========================

    const percentagePresets =
        document.querySelectorAll(
            "[data-resize-percentage]"
        );


    percentagePresets.forEach(
        preset => {

            preset.addEventListener(
                "click",
                () => {

                    const value =
                        Number(
                            preset.dataset.resizePercentage
                        );


                    percentageInput.value =
                        value;


                    percentagePresets.forEach(
                        item => {

                            item.classList.remove(
                                "active"
                            );

                        }
                    );


                    preset.classList.add(
                        "active"
                    );

                }
            );

        }
    );


    percentageInput.addEventListener(
        "input",
        () => {

            const current =
                Number(
                    percentageInput.value
                );


            percentagePresets.forEach(
                preset => {

                    const presetValue =
                        Number(
                            preset.dataset.resizePercentage
                        );


                    preset.classList.toggle(
                        "active",
                        presetValue === current
                    );

                }
            );

        }
    );


    // =========================
    // RESIZE
    // =========================

    resizeButton.addEventListener(
        "click",
        async () => {

            if (selectedFiles.length === 0) {

                showMessage(
                    "Please select at least one image.",
                    true
                );

                return;
            }


            if (
                dimensionsMode.checked &&
                (
                    !Number(widthInput.value) ||
                    Number(widthInput.value) < 1 ||
                    !Number(heightInput.value) ||
                    Number(heightInput.value) < 1
                )
            ) {

                showMessage(
                    "Please enter valid width and height values.",
                    true
                );

                return;
            }


            if (
                percentageMode.checked &&
                (
                    !Number(percentageInput.value) ||
                    Number(percentageInput.value) < 1
                )
            ) {

                showMessage(
                    "Please enter a valid resize percentage.",
                    true
                );

                return;
            }


            resizeButton.disabled = true;


            const originalButtonText =
                resizeButton.innerHTML;


            resizeButton.innerHTML = `
                <span>⏳</span>
                Resizing...
            `;


            const formData =
                new FormData();


            selectedFiles.forEach(
                file => {

                    formData.append(
                        "files",
                        file
                    );

                }
            );


            formData.append(
                "resizeMode",
                dimensionsMode.checked
                    ? "dimensions"
                    : "percentage"
            );


            if (dimensionsMode.checked) {

                formData.append(
                    "width",
                    widthInput.value
                );


                formData.append(
                    "height",
                    heightInput.value
                );


                formData.append(
                    "keepAspectRatio",
                    keepAspect.checked
                );

            }
            else {

                formData.append(
                    "percentage",
                    percentageInput.value
                );


                formData.append(
                    "keepAspectRatio",
                    "true"
                );

            }


            formData.append(
                "outputFormat",
                outputFormat.value
            );


            formData.append(
                "quality",
                resizeQuality.value
            );


            try {

                const response =
                    await fetch(
                        "/Resizer/Resize",
                        {
                            method: "POST",
                            body: formData
                        }
                    );


                if (!response.ok) {

                    const errorText =
                        await response.text();


                    throw new Error(
                        errorText ||
                        "Resize failed."
                    );

                }


                const results =
                    await response.json();


                if (
                    !Array.isArray(results) ||
                    results.length === 0
                ) {

                    throw new Error(
                        "No resized images were returned."
                    );

                }


                removeResults();


                createResultsSection();


                results.forEach(
                    result => {

                        showResizeResult(
                            result
                        );

                    }
                );


                scrollToResults();

            }
            catch (error) {

                console.error(
                    "Resize error:",
                    error
                );


                showMessage(
                    error.message ||
                    "Resize failed. Please try again.",
                    true
                );

            }
            finally {

                resizeButton.disabled = false;

                resizeButton.innerHTML =
                    originalButtonText;

            }

        }
    );


    // =========================
    // RESULTS
    // =========================

    function createResultsSection() {

        let resultsSection =
            document.getElementById(
                "resizeResultsSection"
            );


        if (resultsSection) {
            return resultsSection;
        }


        resultsSection =
            document.createElement(
                "div"
            );


        resultsSection.id =
            "resizeResultsSection";


        resultsSection.className =
            "results-section resize-results-section";


        const converterCard =
            document.querySelector(
                ".converter-card"
            );


        converterCard.appendChild(
            resultsSection
        );


        resultsSection.innerHTML = `

            <div class="results-header">

                <div class="results-title-area">

                    <div class="results-success-icon">
                        ✓
                    </div>

                    <div>

                        <h3>
                            Resize Complete
                        </h3>

                        <p id="resizeResultsSummary">
                            Your images are ready.
                        </p>

                    </div>

                </div>

            </div>


            <div
                id="resizeResultsList"
                class="results-list">
            </div>


            <div class="results-actions">

                <div class="results-action-group">

                    <button
                        type="button"
                        id="resizeDownloadAll"
                        class="download-all-button">

                        <span class="download-all-icon">
                            ↓
                        </span>

                        Download All

                    </button>

                    <button
                        type="button"
                        id="resizeConvertMore"
                        class="convert-more-button">

                        Resize More

                    </button>

                </div>

            </div>

        `;


        const downloadAll =
            document.getElementById(
                "resizeDownloadAll"
            );


        const convertMore =
            document.getElementById(
                "resizeConvertMore"
            );


        downloadAll.addEventListener(
            "click",
            downloadAllResults
        );


        convertMore.addEventListener(
            "click",
            () => {

                removeResults();

                selectedSection.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }
        );


        return resultsSection;

    }


    // =========================
    // SHOW RESULT
    // =========================

    function showResizeResult(result) {

        const resultsList =
            document.getElementById(
                "resizeResultsList"
            );

        if (!resultsList) {
            return;
        }

        if (!window.__imageForgeResizeResults) {
            window.__imageForgeResizeResults = [];
        }

        window.__imageForgeResizeResults.push(result);

        const resultCard =
            document.createElement("div");

        resultCard.className =
            "result-card resize-result-card";

        const originalDimensions =
            `${result.originalWidth} × ${result.originalHeight}`;

        const resizedDimensions =
            `${result.resizedWidth} × ${result.resizedHeight}`;

        const sizeText =
            getSizeDifferenceText(
                result.originalSize,
                result.resizedSize
            );

        const sizeClass =
            getSizeDifferenceClass(
                result.originalSize,
                result.resizedSize
            );

        resultCard.innerHTML = `

        <div class="result-preview">

            <img
                src="data:${result.contentType};base64,${result.data}"
                alt="Resized image"
            />

        </div>

        <div class="result-details">

            <div class="result-name">
                ${escapeHtml(result.fileName)}
            </div>

            <div class="format-conversion">

                <span class="format-badge original-format">
                    ${escapeHtml(result.originalFormat)}
                </span>

                <span class="format-arrow">
                    →
                </span>

                <span class="format-badge converted-format">
                    ${escapeHtml(result.resizedFormat)}
                </span>

            </div>

            <div class="resize-dimension-comparison">

                <div class="resize-result-stat">

                    <span>
                        Original
                    </span>

                    <strong>
                        ${originalDimensions}
                    </strong>

                </div>

                <span class="resize-stat-arrow">
                    →
                </span>

                <div class="resize-result-stat">

                    <span>
                        Resized
                    </span>

                    <strong>
                        ${resizedDimensions}
                    </strong>

                </div>

            </div>

            <div class="resize-file-stats">

                <span>
                    ${formatFileSize(result.originalSize)}
                </span>

                <span>
                    →
                </span>

                <span>
                    ${formatFileSize(result.resizedSize)}
                </span>

                <span class="resize-size-result ${sizeClass}">
                    ${sizeText}
                </span>

            </div>

        </div>

        <button
            type="button"
            class="download-result-button">

            <span>↓</span>
            Download

        </button>

    `;

        const downloadButton =
            resultCard.querySelector(
                ".download-result-button"
            );

        downloadButton.addEventListener(
            "click",
            () => {

                downloadResult(result);

            }
        );

        resultsList.appendChild(
            resultCard
        );

        updateResultsSummary();
    }


    // =========================
    // SUMMARY
    // =========================

    function updateResultsSummary() {

        const resultsList =
            document.getElementById(
                "resizeResultsList"
            );


        const summary =
            document.getElementById(
                "resizeResultsSummary"
            );


        if (
            !resultsList ||
            !summary
        ) {
            return;
        }


        const count =
            resultsList.querySelectorAll(
                ".result-card"
            ).length;


        summary.textContent =
            `${count} image${count > 1 ? "s" : ""} resized successfully`;

    }


    // =========================
    // DOWNLOAD ONE
    // =========================

    function downloadResult(result) {

        try {

            const byteCharacters =
                atob(result.data);


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
                        type:
                            result.contentType
                    }
                );


            const url =
                URL.createObjectURL(
                    blob
                );


            const link =
                document.createElement(
                    "a"
                );


            link.href =
                url;


            link.download =
                result.fileName;


            document.body.appendChild(
                link
            );


            link.click();


            link.remove();


            setTimeout(
                () => {

                    URL.revokeObjectURL(
                        url
                    );

                },
                1000
            );

        }
        catch (error) {

            console.error(
                "Download error:",
                error
            );


            showMessage(
                "Unable to download the image.",
                true
            );

        }

    }


    // =========================
    // DOWNLOAD ALL
    // =========================

    async function downloadAllResults() {

        const resultsSection =
            document.getElementById(
                "resizeResultsSection"
            );


        if (!resultsSection) {
            return;
        }


        const resultCards =
            resultsSection.querySelectorAll(
                ".result-card"
            );


        if (resultCards.length === 0) {
            return;
        }


        const button =
            document.getElementById(
                "resizeDownloadAll"
            );


        if (!button) {
            return;
        }


        button.disabled = true;


        const originalText =
            button.innerHTML;


        button.innerHTML = `
            <span class="download-spinner"></span>
            Preparing...
        `;


        try {

            const results =
                window.__imageForgeResizeResults ||
                [];


            if (results.length === 0) {

                throw new Error(
                    "No resized images are available."
                );

            }


            // Browser-native download of each result.
            // A short delay prevents browsers from
            // blocking every download as a single burst.

            for (
                let i = 0;
                i < results.length;
                i++
            ) {

                downloadResult(
                    results[i]
                );


                await delay(250);

            }


            button.innerHTML = `
                <span class="download-all-icon">
                    ✓
                </span>
                Downloaded
            `;


            button.classList.add(
                "download-complete"
            );


            setTimeout(
                () => {

                    button.innerHTML =
                        originalText;

                    button.classList.remove(
                        "download-complete"
                    );

                    button.disabled = false;

                },
                2200
            );

        }
        catch (error) {

            console.error(
                "Download all error:",
                error
            );


            button.innerHTML =
                originalText;


            button.disabled = false;


            showMessage(
                error.message ||
                "Unable to download all images.",
                true
            );

        }

    }


    // =========================
    // STORE RESULTS
    // =========================

    const originalShowResizeResult =
        showResizeResult;


    function storeResultForDownload(result) {

        if (
            !window.__imageForgeResizeResults
        ) {

            window.__imageForgeResizeResults =
                [];

        }


        window.__imageForgeResizeResults.push(
            result
        );

    }


    // =========================
    // PATCH RESULT STORAGE
    // =========================

    // Wrap the original function behavior
    // through a local reference.

    const originalResizeButtonHandler =
        resizeButton;


    // Results are stored when rendered by
    // intercepting create/show flow below.

    const existingCreateResultsSection =
        createResultsSection;


    // =========================
    // RESULT CLEANUP
    // =========================

    function removeResults() {

        const resultsSection =
            document.getElementById(
                "resizeResultsSection"
            );


        if (resultsSection) {

            resultsSection.remove();

        }


        window.__imageForgeResizeResults =
            [];

    }


    // =========================
    // IMAGE DIMENSIONS
    // =========================

    function getImageDimensions(
        file,
        callback
    ) {

        const url =
            URL.createObjectURL(
                file
            );


        const image =
            new Image();


        image.onload =
            () => {

                callback({
                    width: image.naturalWidth,
                    height: image.naturalHeight
                });


                URL.revokeObjectURL(
                    url
                );

            };


        image.onerror =
            () => {

                callback(null);

                URL.revokeObjectURL(
                    url
                );

            };


        image.src =
            url;

    }


    // =========================
    // SIZE DIFFERENCE
    // =========================

    function getSizeDifferenceText(
        original,
        resized
    ) {

        if (
            !original ||
            !resized
        ) {
            return "—";
        }


        if (
            resized === original
        ) {
            return "Same size";
        }


        if (
            resized < original
        ) {

            const percentage =
                Math.round(
                    (
                        (original - resized) /
                        original
                    ) * 100
                );


            return `${percentage}% smaller`;

        }


        const percentage =
            Math.round(
                (
                    (resized - original) /
                    original
                ) * 100
            );


        return `${percentage}% larger`;

    }


    // =========================
    // SIZE CLASS
    // =========================

    function getSizeDifferenceClass(
        original,
        resized
    ) {

        if (resized < original) {
            return "size-reduced";
        }


        if (resized > original) {
            return "size-increased";
        }


        return "size-same";

    }


    // =========================
    // FILE SIZE
    // =========================

    function formatFileSize(bytes) {

        if (!bytes) {
            return "0 Bytes";
        }


        const units = [
            "Bytes",
            "KB",
            "MB",
            "GB"
        ];


        const index =
            Math.floor(
                Math.log(bytes) /
                Math.log(1024)
            );


        return (
            parseFloat(
                (
                    bytes /
                    Math.pow(
                        1024,
                        index
                    )
                ).toFixed(2)
            )
            +
            " "
            +
            units[index]
        );

    }


    // =========================
    // HTML ESCAPE
    // =========================

    function escapeHtml(text) {

        const div =
            document.createElement(
                "div"
            );


        div.textContent =
            text ?? "";


        return div.innerHTML;

    }


    // =========================
    // MESSAGE
    // =========================

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
            "image-forge-message";


        if (isError) {

            element.classList.add(
                "error"
            );

        }


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


    // =========================
    // DELAY
    // =========================

    function delay(
        milliseconds
    ) {

        return new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    milliseconds
                )
        );

    }


    // =========================
    // SCROLL RESULTS
    // =========================

    function scrollToResults() {

        const results =
            document.getElementById(
                "resizeResultsSection"
            );


        if (!results) {
            return;
        }


        setTimeout(
            () => {

                results.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            },
            100
        );

    }


    // =========================
    // INITIAL STATE
    // =========================

    updateResizeMode();

});