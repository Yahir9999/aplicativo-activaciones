let codeReader = null;
let controls = null;
let scannerActivo = false;
let lecturaProcesada = false;
let streamActivo = null;
let detectorBarcode = null;

const btnScanner = document.getElementById("btnScanner");
const reader = document.getElementById("reader");

btnScanner.addEventListener("click", iniciarScanner);

async function iniciarScanner() {
    detenerTodoScanner();

    scannerActivo = true;
    lecturaProcesada = false;
    reader.style.display = "block";

    // lo demás queda igual

    reader.innerHTML = `
        <video
            id="videoScanner"
            autoplay
            muted
            playsinline
            style="width:100%; border-radius:12px;">
        </video>
    `;

    const video = document.getElementById("videoScanner");

    try {
        if ("BarcodeDetector" in window) {
            await iniciarScannerNativo(video);
        } else {
            await iniciarScannerZXing(video);
        }
    } catch (error) {
        console.error("Error al abrir cámara:", error);
        detenerTodoScanner();
        mostrarMensaje("error", "No se pudo abrir la cámara.");
    }
}

async function iniciarScannerNativo(video) {
    detectorBarcode = new BarcodeDetector({
        formats: ["code_128", "code_39", "code_93"]
    });

    streamActivo = await navigator.mediaDevices.getUserMedia({
        video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 }
        }
    });

    video.srcObject = streamActivo;

    await video.play();

    escanearConBarcodeDetector(video);
}

async function escanearConBarcodeDetector(video) {
    if (!scannerActivo || lecturaProcesada) return;

    try {
        const codigos = await detectorBarcode.detect(video);

        if (codigos && codigos.length > 0) {
            const codigo = codigos[0].rawValue;

            if (codigo && !lecturaProcesada) {
                lecturaProcesada = true;
                codigoLeido(codigo);
                return;
            }
        }
    } catch (error) {
        console.warn("Barcode Detection API falló, usando ZXing:", error);
        await iniciarScannerZXing(video);
        return;
    }

    requestAnimationFrame(() => escanearConBarcodeDetector(video));
}

async function iniciarScannerZXing(video) {
    codeReader = new ZXingBrowser.BrowserMultiFormatReader();

    controls = await codeReader.decodeFromConstraints(
        {
            video: {
                facingMode: "environment",
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        },
        video,
        (result, error) => {
            if (result && !lecturaProcesada) {
                lecturaProcesada = true;
                codigoLeido(result.getText());
            }
        }
    );
}

async function codigoLeido(decodedText) {
    try {
        const serieLimpia = decodedText
            .trim()
            .replace(/\s+/g, "")
            .toUpperCase();

        const vinValido = /^3MU[A-HJ-NPR-Z0-9]{14}$/;

        if (!vinValido.test(serieLimpia)) {
            console.warn("Lectura rechazada:", serieLimpia);
            lecturaProcesada = false;
            return;
        }

        serie.value = serieLimpia;
        serie.readOnly = true;
        serieEscaneada = true;

        if (navigator.vibrate) {
            navigator.vibrate(120);
        }

        confirmacionSerie.classList.remove("oculto");

        validarFormulario();

        detenerTodoScanner();

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

        codeReader = null;
        detectorBarcode = null;

        reader.innerHTML = "";
        reader.style.display = "none";

        scannerActivo = false;
        lecturaProcesada = false;

    } catch (error) {
        console.error("Error al detener scanner:", error);
    }
}