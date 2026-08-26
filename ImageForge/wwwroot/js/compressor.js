document.addEventListener("DOMContentLoaded", () => {

    // =========================
    // DOM ELEMENTS
    // =========================

    const imageInput =
        document.getElementById("compressImageInput");

    const uploadZone =
        document.getElementById("compressUploadZone");

    const selectedSection =
        document.getElementById("compressSelectedSection");

    const imageGrid =
        document.getElementById("compressImageGrid");

    const imageCount =
        document.getElementById("compressImageCount");

    const clearImages =
        document.getElementById("compressClearImages");

    const quality =
        document.getElementById("compressQuality");

    const qualityValue =
        document.getElementById("compressQualityValue");

    const outputFormat =
        document.getElementById("compressOutputFormat");

    const compressButton =
        document.getElementById("compressButton");

    const qualityMode =
        document.getElementById("qualityMode");

    const sizeMode =
        document.getElementById("sizeMode");

    const qualitySettings =
        document.getElementById("qualitySettings");

    const targetSize =
        document.getElementById("targetSize");

    const targetSizeUnit =
        document.getElementById("targetSizeUnit");

    const targetSizeInfo =
        document.getElementById("targetSizeInfo");


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
        !quality ||
        !qualityValue ||
        !outputFormat ||
        !compressButton
    ) {
        return;
    }


    // =========================
    // SELECTED FILES
    // =========================

    let selectedFiles = [];


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
    // DRAG OVER
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


    // =========================
    // DRAG LEAVE
    // =========================

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
    // DROP FILES
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

            alert(
                "Please select JPG, PNG, or WEBP images."
            );

            return;
        }


        // =========================
        // MAX FILE COUNT
        // =========================

        if (
            selectedFiles.length +
            validFiles.length >
            20
        ) {

            alert(
                "You can select a maximum of 20 images."
            );

            return;
        }


        // =========================
        // ADD FILES
        // =========================

        selectedFiles = [
            ...selectedFiles,
            ...validFiles
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
            file => {

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

                            <img
                                src="${event.target.result}"
                                alt="Image preview"
                            />

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

                    };


                reader.readAsDataURL(
                    file
                );

            }
        );

    }


    // =========================
    // CLEAR IMAGES
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
    // QUALITY SLIDER
    // =========================

    quality.addEventListener(
        "input",
        () => {

            qualityValue.textContent =
                `${quality.value}%`;

            updateCompressionMode();

        }
    );


    // =========================
    // COMPRESSION PRESETS
    // =========================

    const compressionModes =
        document.querySelectorAll(
            "[data-compress-quality]"
        );


    compressionModes.forEach(
        mode => {

            mode.addEventListener(
                "click",
                () => {

                    const selectedQuality =
                        Number(
                            mode.dataset.compressQuality
                        );


                    quality.value =
                        selectedQuality;


                    qualityValue.textContent =
                        `${selectedQuality}%`;


                    compressionModes.forEach(
                        item => {

                            item.classList.remove(
                                "active"
                            );

                        }
                    );


                    mode.classList.add(
                        "active"
                    );

                }
            );

        }
    );


    // =========================
    // UPDATE QUALITY MODE
    // =========================

    function updateCompressionMode() {

        const currentQuality =
            Number(
                quality.value
            );


        compressionModes.forEach(
            mode => {

                const modeQuality =
                    Number(
                        mode.dataset.compressQuality
                    );


                if (
                    modeQuality ===
                    currentQuality
                ) {

                    mode.classList.add(
                        "active"
                    );

                }
                else {

                    mode.classList.remove(
                        "active"
                    );

                }

            }
        );

    }


    // =========================
    // COMPRESSION METHOD
    // =========================

    function updateCompressionMethod() {

        if (
            sizeMode &&
            sizeMode.checked
        ) {

            if (qualitySettings) {

                qualitySettings.style.display =
                    "none";

            }


            if (targetSizeInfo) {

                targetSizeInfo.hidden =
                    false;

            }

        }
        else {

            if (qualitySettings) {

                qualitySettings.style.display =
                    "";

            }


            if (targetSizeInfo) {

                targetSizeInfo.hidden =
                    true;

            }

        }

    }


    if (qualityMode) {

        qualityMode.addEventListener(
            "change",
            updateCompressionMethod
        );

    }


    if (sizeMode) {

        sizeMode.addEventListener(
            "change",
            updateCompressionMethod
        );

    }


    // =========================
    // TARGET SIZE VALIDATION
    // =========================

    if (targetSize) {

        targetSize.addEventListener(
            "input",
            () => {

                let value =
                    Number(
                        targetSize.value
                    );


                if (
                    !Number.isFinite(value) ||
                    value < 1
                ) {

                    return;

                }


                if (
                    targetSizeUnit &&
                    targetSizeUnit.value === "KB" &&
                    value > 20480
                ) {

                    targetSize.value =
                        20480;

                }


                if (
                    targetSizeUnit &&
                    targetSizeUnit.value === "MB" &&
                    value > 20
                ) {

                    targetSize.value =
                        20;

                }

            }
        );

    }


    if (targetSizeUnit) {

        targetSizeUnit.addEventListener(
            "change",
            () => {

                if (!targetSize) {

                    return;

                }


                const value =
                    Number(
                        targetSize.value
                    );


                if (
                    !Number.isFinite(value) ||
                    value <= 0
                ) {

                    return;

                }


                if (
                    targetSizeUnit.value === "KB" &&
                    value > 20480
                ) {

                    targetSize.value =
                        20480;

                }


                if (
                    targetSizeUnit.value === "MB" &&
                    value > 20
                ) {

                    targetSize.value =
                        20;

                }

            }
        );

    }


    // =========================
    // INITIAL COMPRESSION MODE
    // =========================

    updateCompressionMethod();


    // =========================
    // COMPRESS IMAGES
    // =========================

    compressButton.addEventListener(
        "click",
        async () => {

            if (selectedFiles.length === 0) {

                alert(
                    "Please select at least one image."
                );

                return;
            }


            // =========================
            // DETERMINE METHOD
            // =========================

            const compressionMethod =
                sizeMode &&
                    sizeMode.checked
                    ? "size"
                    : "quality";


            // =========================
            // TARGET SIZE VALIDATION
            // =========================

            let targetSizeValue =
                0;


            let targetSizeUnitValue =
                "KB";


            if (
                compressionMethod ===
                "size"
            ) {

                if (!targetSize) {

                    alert(
                        "Target size input was not found."
                    );

                    return;
                }


                targetSizeValue =
                    Number(
                        targetSize.value
                    );


                if (
                    !Number.isFinite(
                        targetSizeValue
                    ) ||
                    targetSizeValue <= 0
                ) {

                    alert(
                        "Please enter a valid target file size."
                    );

                    targetSize.focus();

                    return;
                }


                targetSizeUnitValue =
                    targetSizeUnit
                        ? targetSizeUnit.value
                        : "KB";


                if (
                    targetSizeUnitValue ===
                    "KB" &&
                    targetSizeValue > 20480
                ) {

                    alert(
                        "Target size cannot exceed 20 MB."
                    );

                    return;
                }


                if (
                    targetSizeUnitValue ===
                    "MB" &&
                    targetSizeValue > 20
                ) {

                    alert(
                        "Target size cannot exceed 20 MB."
                    );

                    return;
                }

            }


            // =========================
            // DISABLE BUTTON
            // =========================

            compressButton.disabled =
                true;


            const originalButtonText =
                compressButton.innerHTML;


            compressButton.innerHTML = `
                <span>⏳</span>
                Compressing...
            `;


            // =========================
            // FORM DATA
            // =========================

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
                "outputFormat",
                outputFormat.value
            );


            formData.append(
                "quality",
                quality.value
            );


            // =========================
            // COMPRESSION METHOD
            // =========================

            formData.append(
                "compressionMethod",
                compressionMethod
            );


            // =========================
            // TARGET SIZE
            // =========================

            if (
                compressionMethod ===
                "size"
            ) {

                formData.append(
                    "targetSize",
                    targetSizeValue
                );


                formData.append(
                    "targetSizeUnit",
                    targetSizeUnitValue
                );

            }


            // =========================
            // SEND REQUEST
            // =========================

            try {

                const response =
                    await fetch(
                        "/Compressor/Compress",
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
                        "Compression failed."
                    );

                }


                const results =
                    await response.json();


                if (
                    !Array.isArray(
                        results
                    ) ||
                    results.length === 0
                ) {

                    throw new Error(
                        "No compressed images were returned."
                    );

                }


                // =========================
                // REMOVE OLD RESULTS
                // =========================

                removeResults();


                // =========================
                // DISPLAY RESULTS
                // =========================

                results.forEach(
                    result => {

                        showCompressionResult(
                            result
                        );

                    }
                );

            }
            catch (error) {

                console.error(
                    "Compression error:",
                    error
                );


                alert(
                    error.message ||
                    "Compression failed. Please try again."
                );

            }
            finally {

                compressButton.disabled =
                    false;


                compressButton.innerHTML =
                    originalButtonText;

            }

        }
    );


    // =========================
    // SHOW RESULT
    // =========================

    function showCompressionResult(
        result
    ) {

        let resultsSection =
            document.getElementById(
                "compressResultsSection"
            );


        if (!resultsSection) {

            resultsSection =
                document.createElement(
                    "div"
                );


            resultsSection.id =
                "compressResultsSection";


            resultsSection.className =
                "results-section";


            const converterCard =
                document.querySelector(
                    ".converter-card"
                );


            if (!converterCard) {

                return;

            }


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
                                Compression Complete
                            </h3>

                            <p id="compressResultsSummary">
                                Your images are ready.
                            </p>

                        </div>

                    </div>

                </div>


                <div
                    id="compressResultsList"
                    class="results-list">
                </div>

            `;

        }


        const resultsList =
            document.getElementById(
                "compressResultsList"
            );


        if (!resultsList) {

            return;

        }


        const originalSize =
            Number(
                result.originalSize || 0
            );


        const compressedSize =
            Number(
                result.compressedSize || 0
            );


        let sizeText =
            "Same size";


        let sizeClass =
            "size-same";


        if (
            compressedSize <
            originalSize
        ) {

            const percentage =
                originalSize > 0
                    ? Math.round(
                        (
                            (
                                originalSize -
                                compressedSize
                            ) /
                            originalSize
                        ) * 100
                    )
                    : 0;


            sizeText =
                `${percentage}% smaller`;


            sizeClass =
                "size-reduced";

        }
        else if (
            compressedSize >
            originalSize
        ) {

            const percentage =
                originalSize > 0
                    ? Math.round(
                        (
                            (
                                compressedSize -
                                originalSize
                            ) /
                            originalSize
                        ) * 100
                    )
                    : 0;


            sizeText =
                `${percentage}% larger`;


            sizeClass =
                "size-increased";

        }


        const resultCard =
            document.createElement(
                "div"
            );


        resultCard.className =
            "result-card";


        resultCard.innerHTML = `

            <div class="result-preview">

                <img
                    src="data:${escapeHtml(result.contentType)};base64,${result.data}"
                    alt="Compressed image"
                />

            </div>


            <div class="result-details">

                <div class="result-name">

                    ${escapeHtml(
            result.fileName
        )}

                </div>


                <div class="format-conversion">

                    <span class="format-badge original-format">

                        ${escapeHtml(
            result.originalFormat
        )}

                    </span>

                    <span class="format-arrow">
                        →
                    </span>

                    <span class="format-badge converted-format">

                        ${escapeHtml(
            result.compressedFormat
        )}

                    </span>

                </div>


                <div class="compression-stats">

                    <div class="compression-stat">

                        <span class="compression-stat-label">
                            Original
                        </span>

                        <strong class="compression-stat-value">

                            ${formatFileSize(
            originalSize
        )}

                        </strong>

                    </div>


                    <div class="compression-stat-arrow">
                        →
                    </div>


                    <div class="compression-stat">

                        <span class="compression-stat-label">
                            Compressed
                        </span>

                        <strong class="compression-stat-value">

                            ${formatFileSize(
            compressedSize
        )}

                        </strong>

                    </div>


                    <div class="compression-stat-saving ${sizeClass}">

                        <span class="compression-stat-label">
                            Result
                        </span>

                        <strong class="compression-saving-value">

                            ${sizeText}

                        </strong>

                    </div>

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


        if (downloadButton) {

            downloadButton.addEventListener(
                "click",
                () => {

                    downloadResult(
                        result
                    );

                }
            );

        }


        resultsList.appendChild(
            resultCard
        );


        const allResults =
            resultsList.querySelectorAll(
                ".result-card"
            );


        const summary =
            document.getElementById(
                "compressResultsSummary"
            );


        if (summary) {

            summary.textContent =
                `${allResults.length} image${allResults.length > 1 ? "s" : ""} compressed successfully`;

        }

    }


    // =========================
    // DOWNLOAD RESULT
    // =========================

    function downloadResult(
        result
    ) {

        try {

            const byteCharacters =
                atob(
                    result.data
                );


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


            alert(
                "Unable to download the compressed image."
            );

        }

    }


    // =========================
    // REMOVE RESULTS
    // =========================

    function removeResults() {

        const resultsSection =
            document.getElementById(
                "compressResultsSection"
            );


        if (resultsSection) {

            resultsSection.remove();

        }

    }


    // =========================
    // FILE SIZE FORMAT
    // =========================

    function formatFileSize(
        bytes
    ) {

        if (
            !bytes ||
            bytes <= 0
        ) {

            return "0 Bytes";

        }


        const units =
            [
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

    function escapeHtml(
        text
    ) {

        const div =
            document.createElement(
                "div"
            );


        div.textContent =
            text == null
                ? ""
                : String(text);


        return div.innerHTML;

    }

});