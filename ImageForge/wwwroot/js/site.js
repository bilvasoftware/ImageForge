document.addEventListener("DOMContentLoaded", () => {

    // =========================
    // DOM ELEMENTS
    // =========================

    const imageInput =
        document.getElementById("imageInput");

    const uploadZone =
        document.getElementById("uploadZone");

    const selectedSection =
        document.getElementById("selectedSection");

    const imageGrid =
        document.getElementById("imageGrid");

    const imageCount =
        document.getElementById("imageCount");

    const clearImages =
        document.getElementById("clearImages");

    const quality =
        document.getElementById("quality");

    const qualityValue =
        document.getElementById("qualityValue");

    const convertButton =
        document.getElementById("convertButton");

    const outputFormat =
        document.getElementById("outputFormat");


    // =========================
    // SELECTED FILES
    // =========================

    let selectedFiles = [];


    // =========================
    // SAFETY CHECK
    // =========================

    if (!imageInput ||
        !uploadZone ||
        !selectedSection ||
        !imageGrid ||
        !imageCount ||
        !clearImages ||
        !quality ||
        !qualityValue ||
        !convertButton ||
        !outputFormat) {

        console.error(
            "ImageForge: Required HTML elements were not found."
        );

        return;
    }


    // =========================
    // FILE SELECTION
    // =========================

    imageInput.addEventListener(
        "change",
        (event) => {

            addFiles(event.target.files);

        }
    );


    // =========================
    // DRAG ENTER / OVER
    // =========================

    ["dragenter", "dragover"].forEach(
        (eventName) => {

            uploadZone.addEventListener(
                eventName,
                (event) => {

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
    // DRAG LEAVE / DROP
    // =========================

    ["dragleave", "drop"].forEach(
        (eventName) => {

            uploadZone.addEventListener(
                eventName,
                (event) => {

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
        (event) => {

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


        const imageFiles =
            incomingFiles.filter(
                file =>
                    file.type &&
                    file.type.startsWith("image/")
            );


        if (imageFiles.length === 0) {

            showMessage(
                "Please select valid image files.",
                "error"
            );

            return;
        }


        selectedFiles = [
            ...selectedFiles,
            ...imageFiles
        ];


        renderImages();

    }


    // =========================
    // RENDER SELECTED IMAGES
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
                    (event) => {

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
                            >

                            <div class="image-info">

                                <div class="image-name">

                                    ${escapeHtml(
                            file.name
                        )}

                                </div>

                                <div class="image-size">

                                    ${formatFileSize(
                            file.size
                        )}

                                </div>

                            </div>

                        `;


                        imageGrid.appendChild(
                            card
                        );

                    };


                reader.onerror =
                    () => {

                        console.error(
                            "Unable to preview:",
                            file.name
                        );

                    };


                reader.readAsDataURL(file);

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

            renderImages();

            removeResults();

        }
    );


    // =========================
    // QUALITY SLIDER
    // =========================

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
    // COMPRESSION MODES
    // =========================

    const compressionModes =
        document.querySelectorAll(
            ".compression-mode"
        );


    compressionModes.forEach(
        mode => {

            mode.addEventListener(
                "click",
                () => {

                    const selectedQuality =
                        Number(
                            mode.dataset.quality
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
    // UPDATE MODE
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
                        mode.dataset.quality
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
    // CONVERT BUTTON
    // =========================

    convertButton.addEventListener(
        "click",
        async () => {

            // No files
            if (selectedFiles.length === 0) {

                showMessage(
                    "Please select at least one image.",
                    "error"
                );

                return;
            }


            // No output format
            if (!outputFormat.value) {

                showMessage(
                    "Please select an output format.",
                    "error"
                );

                return;
            }


            // Disable button
            convertButton.disabled = true;


            convertButton.innerHTML = `
                <span>⏳</span>
                Converting...
            `;


            // Create FormData
            const formData =
                new FormData();


            // Add files
            selectedFiles.forEach(
                file => {

                    formData.append(
                        "files",
                        file
                    );

                }
            );


            // Add format
            formData.append(
                "outputFormat",
                outputFormat.value
            );


            // Add quality
            formData.append(
                "quality",
                quality.value
            );


            try {

                const response =
                    await fetch(
                        "/Converter/Convert",
                        {
                            method: "POST",
                            body: formData
                        }
                    );


                // Server error
                if (!response.ok) {

                    const errorText =
                        await response.text();


                    console.error(
                        "Server error:",
                        errorText
                    );


                    throw new Error(
                        errorText ||
                        "Conversion failed."
                    );

                }


                // Read JSON
                const results =
                    await response.json();


                if (!Array.isArray(results) ||
                    results.length === 0) {

                    throw new Error(
                        "No converted files were returned."
                    );

                }


                // Remove old results
                removeResults();


                // =========================
                // Show results
                // =========================

                results.forEach(
                    result => {

                        showConversionResult(
                            result
                        );

                    }
                );


                // =========================
                // CONNECT DOWNLOAD ALL
                // =========================

                const downloadAllButton =
                    document.getElementById(
                        "downloadAllButton"
                    );


                if (downloadAllButton) {

                    downloadAllButton.onclick =
                        () => {

                            downloadAllResults(
                                results
                            );

                        };

                }


                // =========================
                // SCROLL TO RESULTS
                // =========================

                const resultsSection =
                    document.getElementById(
                        "resultsSection"
                    );



                if (resultsSection) {

                    resultsSection.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                }

            }
            catch (error) {

                console.error(
                    "Conversion error:",
                    error
                );


                showMessage(
                    "Conversion failed. Please try again.",
                    "error"
                );

            }
            finally {

                // Enable button
                convertButton.disabled = false;


                convertButton.innerHTML = `
                    <span>⚡</span>
                    Convert Images
                `;

            }

        }
    );


    // =========================
    // SHOW CONVERSION RESULT
    // =========================

    function showConversionResult(result) {

        let resultsSection =
            document.getElementById("resultsSection");


        // =========================
        // CREATE RESULTS SECTION
        // =========================

        if (!resultsSection) {

            resultsSection =
                document.createElement("div");

            resultsSection.id =
                "resultsSection";

            resultsSection.className =
                "results-section";


            const converterCard =
                document.querySelector(".converter-card");


            if (converterCard) {

                converterCard.appendChild(
                    resultsSection
                );

            }
            else {

                document.body.appendChild(
                    resultsSection
                );

            }


            // Header
            const resultsHeader =
                document.createElement("div");

            resultsHeader.className =
                "results-header";

            resultsHeader.innerHTML = `

            <div class="results-title-area">

                <div class="results-success-icon">
                    ✓
                </div>

                <div>

                    <h3>
                        Conversion Complete
                    </h3>

                    <p id="resultsSummary">
                        Your images are ready to download.
                    </p>

                </div>

            </div>

        `;


            resultsSection.appendChild(
                resultsHeader
            );


            // Results list
            const resultsList =
                document.createElement("div");

            resultsList.id =
                "resultsList";

            resultsList.className =
                "results-list";


            resultsSection.appendChild(
                resultsList
            );


            // Bottom actions
            const resultsActions =
                document.createElement("div");

            resultsActions.className =
                "results-actions";


            resultsActions.innerHTML = `

    <div class="results-action-group">

        <button
            type="button"
            class="download-all-button"
            id="downloadAllButton">

            <span class="download-all-icon">↓</span>

            <span>
                Download All
            </span>

        </button>


        <button
            type="button"
            class="convert-more-button"
            id="convertMoreButton">

            <span>↻</span>

            <span>
                Convert More Images
            </span>

        </button>

    </div>

`;


            resultsSection.appendChild(
                resultsActions
            );


            // Convert more
            document
                .getElementById("convertMoreButton")
                .addEventListener(
                    "click",
                    () => {

                        removeResults();

                        selectedFiles = [];

                        imageInput.value = "";

                        renderImages();

                        uploadZone.scrollIntoView({
                            behavior: "smooth",
                            block: "center"
                        });

                    }
                );

        }


        // =========================
        // RESULT LIST
        // =========================

        const resultsList =
            document.getElementById(
                "resultsList"
            );


        const resultCard =
            document.createElement("div");

        resultCard.className =
            "result-card";




        // =========================
        // COMPRESSION / FILE SIZE
        // =========================

        const originalSize =
            Number(result.originalSize || 0);

        const convertedSize =
            Number(result.convertedSize || 0);

      
        let sizeText = "";
        let sizeClass = "";

        if (originalSize > 0) {

            if (convertedSize < originalSize) {

                const savingPercentage =
                    Math.round(
                        ((originalSize - convertedSize) /
                            originalSize) * 100
                    );

                sizeText =
                    `${savingPercentage}% smaller`;

                sizeClass =
                    "size-reduced";

            }
            else if (convertedSize > originalSize) {

                const increasePercentage =
                    Math.round(
                        ((convertedSize - originalSize) /
                            originalSize) * 100
                    );

                sizeText =
                    `${increasePercentage}% larger`;

                sizeClass =
                    "size-increased";

            }
            else {

                sizeText =
                    "Same size";

                sizeClass =
                    "size-same";
            }

        }
        else {

            sizeText =
                "Size unavailable";

            sizeClass =
                "size-same";
        }

        // =========================
        // RESULT CARD HTML
        // =========================

        resultCard.innerHTML = `

        <div class="result-preview">

            <img
                src="data:${result.contentType};base64,${result.data}"
                alt="Converted image"
                loading="lazy"
            >

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
            result.convertedFormat
        )}

                </span>

            </div>


           <div class="compression-stats">

    <div class="compression-stat">

        <span class="compression-stat-label">
            Original
        </span>

        <strong class="compression-stat-value">
            ${formatFileSize(originalSize)}
        </strong>

    </div>


    <div class="compression-stat-arrow">
        →
    </div>


    <div class="compression-stat">

        <span class="compression-stat-label">
            Converted
        </span>

        <strong class="compression-stat-value">
            ${formatFileSize(convertedSize)}
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


        // =========================
        // DOWNLOAD
        // =========================

        const downloadButton =
            resultCard.querySelector(
                ".download-result-button"
            );


        downloadButton.addEventListener(
            "click",
            () => {

                downloadResult(
                    result
                );

            }
        );


        resultsList.appendChild(
            resultCard
        );


        // =========================
        // UPDATE SUMMARY
        // =========================

        const allResults =
            resultsList.querySelectorAll(
                ".result-card"
            );


        const summary =
            document.getElementById(
                "resultsSummary"
            );


        if (summary) {

            summary.textContent =
                `${allResults.length} image${allResults.length > 1 ? "s" : ""} converted successfully`;

        }

    }

    // =========================
    // DOWNLOAD RESULT
    // =========================

    function downloadResult(result) {

        try {

            // Validate data
            if (!result.data) {

                throw new Error(
                    "Converted image data is empty."
                );

            }


            // Decode Base64
            const byteCharacters =
                window.atob(
                    result.data
                );


            const byteLength =
                byteCharacters.length;


            const byteArray =
                new Uint8Array(
                    byteLength
                );


            for (
                let i = 0;
                i < byteLength;
                i++
            ) {

                byteArray[i] =
                    byteCharacters.charCodeAt(i);

            }


            // Create Blob
            const blob =
                new Blob(
                    [byteArray],
                    {
                        type:
                            result.contentType ||
                            "application/octet-stream"
                    }
                );


            // Create URL
            const url =
                window.URL.createObjectURL(
                    blob
                );


            // Create download link
            const link =
                document.createElement(
                    "a"
                );


            link.href = url;

            link.download =
                result.fileName ||
                "converted-image";


            link.style.display =
                "none";


            document.body.appendChild(
                link
            );


            // User initiated click
            link.click();


            // Remove link
            document.body.removeChild(
                link
            );


            // Release memory
            setTimeout(
                () => {

                    window.URL.revokeObjectURL(
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
                "Unable to download the converted image.",
                "error"
            );

        }

    }


    // =========================
    // REMOVE RESULTS
    // =========================

    function removeResults() {

        const resultsSection =
            document.getElementById(
                "resultsSection"
            );


        if (resultsSection) {

            resultsSection.remove();

        }

    }


    // =========================
    // FILE SIZE
    // =========================

    function formatFileSize(bytes) {

        if (bytes === 0) {

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
            text;


        return div.innerHTML;

    }


    // =========================
    // MESSAGE
    // =========================

    function showMessage(
        message,
        type = "error"
    ) {

        console[type === "error"
            ? "error"
            : "log"](message);


        // Remove previous message
        const existing =
            document.getElementById(
                "imageForgeMessage"
            );


        if (existing) {

            existing.remove();

        }


        const messageBox =
            document.createElement(
                "div"
            );


        messageBox.id =
            "imageForgeMessage";


        messageBox.className =
            `image-forge-message ${type}`;


        messageBox.textContent =
            message;


        document.body.appendChild(
            messageBox
        );


        setTimeout(
            () => {

                messageBox.classList.add(
                    "hide"
                );


                setTimeout(
                    () => {

                        messageBox.remove();

                    },
                    300
                );

            },
            3000
        );

    }

    // =========================
    // DOWNLOAD ALL AS ZIP
    // =========================

    async function downloadAllResults(results) {

        const button =
            document.getElementById(
                "downloadAllButton"
            );

        if (!button) {
            return;
        }


        if (!results || results.length === 0) {

            alert(
                "There are no converted images to download."
            );

            return;
        }


        const originalContent =
            button.innerHTML;


        button.disabled = true;

        button.innerHTML = `
        <span class="download-spinner"></span>
        Preparing ZIP...
    `;


        try {

            const files =
                results.map(result => ({
                    fileName:
                        result.fileName,

                    data:
                        result.data
                }));


            const response =
                await fetch(
                    "/Converter/DownloadAll",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(files)
                    }
                );


            if (!response.ok) {

                const error =
                    await response.text();

                throw new Error(error);
            }


            const blob =
                await response.blob();


            const url =
                URL.createObjectURL(blob);


            const link =
                document.createElement("a");


            link.href = url;

            link.download =
                "ImageForge-Converted.zip";


            document.body.appendChild(
                link
            );


            link.click();


            link.remove();


            URL.revokeObjectURL(
                url
            );


            button.innerHTML = `
            <span>✓</span>
            ZIP Downloaded
        `;


            button.classList.add(
                "download-complete"
            );


            setTimeout(() => {

                button.innerHTML =
                    originalContent;

                button.classList.remove(
                    "download-complete"
                );

                button.disabled = false;

            }, 2200);

        }
        catch (error) {

            console.error(
                "ZIP download error:",
                error
            );


            alert(
                "Unable to create the ZIP file. Please try again."
            );


            button.innerHTML =
                originalContent;

            button.disabled = false;
        }
    }




});