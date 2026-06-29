let codeReader = null;
let controls = null;
let scannerActivo = false;
let lecturaProcesada = false;
let streamActivo = null;

const btnScanner = document.getElementById("btnScanner");
const reader = document.getElementById("reader");

btnScanner.addEventListener("click", iniciarScanner);

async function iniciarScanner() {
    detenerScanner();

    scannerActivo = true;
    lecturaProcesada = false;
    reader.style.display = "block";

    reader.innerHTML = `
        <div style="
            position: relative;
            width: 100%;
            max-width: 520px;
            margin: auto;
            border-radius: 14px;
            overflow: hidden;
            background: #000;
        ">
            <video
                id="videoScanner"
                autoplay
                muted
                playsinline
                style="width:100%; display:block;">
            </video>

            <div style="
                position:absolute;
                top:50%;
                left:6%;
                width:88%;
                height:3px;
                background:red;
                box-shadow:0 0 8px red;
                transform:translateY(-50%);
                z-index:5;">
            </div>

            <div style="
                position:absolute;
                bottom:10px;
                left:0;
                width:100%;
                text-align:center;
                color:white;
                font-size:14px;
                background:rgba(0,0,0,.45);
                padding:6px;">
                Alinea el VIN con la línea roja
            </div>
        </div>
    `;

    const video = document.getElementById("videoScanner");

    try {
        await iniciarScannerZXing(video);
    } catch (error) {
        console.error("Error al abrir cámara:", error);
        detenerScanner();
        mostrarMensaje("error", "No se pudo abrir la cámara.");
    }
}

async function iniciarScannerZXing(video) {
    if (typeof ZXingBrowser === "undefined") {
        mostrarMensaje("error", "No se encontró ZXing Browser.");
        return;
    }

    const ZXingLib =
        typeof ZXing !== "undefined"
            ? ZXing
            : ZXingBrowser;

    const hints = new Map();

    const barcodeFormat =
        ZXingLib.BarcodeFormat?.CODE_128 ??
        ZXingBrowser.BarcodeFormat?.CODE_128 ??
        4;

    const possibleFormats =
        ZXingLib.DecodeHintType?.POSSIBLE_FORMATS ??
        ZXingBrowser.DecodeHintType?.POSSIBLE_FORMATS ??
        2;

    const tryHarder =
        ZXingLib.DecodeHintType?.TRY_HARDER ??
        ZXingBrowser.DecodeHintType?.TRY_HARDER ??
        4;

    hints.set(possibleFormats, [barcodeFormat]);
    hints.set(tryHarder, true);

    codeReader = new ZXingBrowser.BrowserMultiFormatReader(hints, {
        delayBetweenScanAttempts: 70,
        delayBetweenScanSuccess: 300
    });

    const constraints = {
        video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
            advanced: [
                { focusMode: "continuous" },
                { exposureMode: "continuous" }
            ]
        }
    };

    controls = await codeReader.decodeFromConstraints(
        constraints,
        video,
        async (result, error, ctrl) => {
            if (!scannerActivo || lecturaProcesada) return;

            if (result) {
                const serieLimpia = limpiarSerie(result.getText());

                if (esVINValido(serieLimpia)) {
                    lecturaProcesada = true;

                    if (ctrl) {
                        ctrl.stop();
                    }

                    await codigoLeido(serieLimpia);
                }
            }
        }
    );

    setTimeout(() => {
        aplicarMejorasCamara(video);
    }, 700);
}

function limpiarSerie(texto) {
    return String(texto || "")
        .trim()
        .replace(/\s+/g, "")
        .replace(/[^A-Z0-9]/gi, "")
        .toUpperCase();
}

function esVINValido(valor) {
    return /^[A-HJ-NPR-Z0-9]{17}$/.test(valor);
}

async function aplicarMejorasCamara(video) {
    try {
        const stream = video.srcObject;
        if (!stream) return;

        streamActivo = stream;

        const track = stream.getVideoTracks()[0];
        if (!track) return;

        const capabilities = track.getCapabilities ? track.getCapabilities() : {};
        const advanced = [];

        if (capabilities.zoom) {
            const zoomMax = capabilities.zoom.max || 1;
            const zoomIdeal = Math.min(2, zoomMax);

            if (zoomIdeal > 1) {
                advanced.push({ zoom: zoomIdeal });
            }
        }

        if (
            capabilities.focusMode &&
            capabilities.focusMode.includes("continuous")
        ) {
            advanced.push({ focusMode: "continuous" });
        }

        if (
            capabilities.exposureMode &&
            capabilities.exposureMode.includes("continuous")
        ) {
            advanced.push({ exposureMode: "continuous" });
        }

        if (advanced.length > 0) {
            await track.applyConstraints({ advanced });
        }

    } catch (error) {
        console.warn("No se pudieron aplicar mejoras de cámara:", error);
    }
}

async function codigoLeido(serieLimpia) {
    try {
        serie.value = serieLimpia;
        serie.readOnly = true;
        serieEscaneada = true;

        if (navigator.vibrate) {
            navigator.vibrate([80, 40, 80]);
        }

        confirmacionSerie.classList.remove("oculto");

        validarFormulario();
        detenerScanner();

    } catch (error) {
        console.error("Error procesando lectura:", error);
        lecturaProcesada = false;
    }
}

function detenerScanner() {
    try {
        if (controls) {
            controls.stop();
            controls = null;
        }

        if (streamActivo) {
            streamActivo.getTracks().forEach(track => track.stop());
            streamActivo = null;
        }

        if (codeReader && codeReader.reset) {
            codeReader.reset();
        }

        codeReader = null;

        reader.innerHTML = "";
        reader.style.display = "none";

        scannerActivo = false;
        lecturaProcesada = false;

    } catch (error) {
        console.error("Error al detener scanner:", error);
    }
}

function detenerTodoScanner() {
    detenerScanner();
}