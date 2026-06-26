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
    detenerTodoScanner(); // Nota: Asegúrate que esta función exista, o usa detenerScanner()

    scannerActivo = true;
    lecturaProcesada = false;
    reader.style.display = "block";

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
            // Verificar si el navegador realmente soporta los formatos que necesitamos
            const formatosSoportados = await BarcodeDetector.getSupportedFormats();
            if (formatosSoportados.includes("code_128") || formatosSoportados.includes("code_39")) {
                await iniciarScannerNativo(video);
                return;
            }
        }
        // Si no es nativo o no soporta los formatos, usar ZXing
        await iniciarScannerZXing(video);
    } catch (error) {
        console.error("Error al abrir cámara:", error);
        detenerScanner();
        mostrarMensaje("error", "No se pudo abrir la cámara.");
    }
}

async function iniciarScannerNativo(video) {
    detectorBarcode = new BarcodeDetector({
        formats: ["code_128", "code_39"] // Reducido solo a los dos más comunes de VIN
    });

    // OPTIMIZACIÓN 1: Subir resolución a Full HD (1080p) para que las líneas del VIN no se junten
    streamActivo = await navigator.mediaDevices.getUserMedia({
        video: {
            facingMode: "environment",
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 },
            focusMode: "continuous"
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
                // Validación rápida antes de detener el flujo para ahorrar tiempo
                const serieLimpia = codigo.trim().replace(/\s+/g, "").toUpperCase();
                if (/^3MU[A-HJ-NPR-Z0-9]{14}$/.test(serieLimpia)) {
                    lecturaProcesada = true;
                    codigoLeido(serieLimpia);
                    return;
                }
            }
        }
    } catch (error) {
        console.warn("Barcode Detection API falló, usando ZXing:", error);
        await iniciarScannerZXing(video);
        return;
    }

    // OPTIMIZACIÓN 2: No saturar el procesador. Esperar 300ms entre capturas en lugar de ir a 60fps
    setTimeout(() => {
        if (scannerActivo && !lecturaProcesada) {
            requestAnimationFrame(() => escanearConBarcodeDetector(video));
        }
    }, 300); 
}

async function iniciarScannerZXing(video) {
    // OPTIMIZACIÓN 3: Decirle a ZXing EXACTAMENTE qué formatos buscar (Pistas / Hints)
    const hints = new Map();
    const formats = [ZXingBrowser.BarcodeFormat.CODE_128, ZXingBrowser.BarcodeFormat.CODE_39];
    hints.set(ZXingBrowser.DecodeHintType.POSSIBLE_FORMATS, formats);
    // Intentar lectura más profunda (útil para cámaras lentas o etiquetas desgastadas)
    hints.set(ZXingBrowser.DecodeHintType.TRY_HARDER, true); 

    codeReader = new ZXingBrowser.BrowserMultiFormatReader(hints);

    controls = await codeReader.decodeFromConstraints(
        {
            video: {
                facingMode: "environment",
                width: { ideal: 1920, min: 1280 },
                height: { ideal: 1080, min: 720 },
                focusMode: "continuous"
            }
        },
        video,
        (result, error) => {
            if (result && !lecturaProcesada) {
                const texto = result.getText();
                const serieLimpia = texto.trim().replace(/\s+/g, "").toUpperCase();
                
                // OPTIMIZACIÓN 4: Validar el patrón ANTES de dar por exitosa la lectura
                if (/^3MU[A-HJ-NPR-Z0-9]{14}$/.test(serieLimpia)) {
                    lecturaProcesada = true;
                    codigoLeido(serieLimpia);
                }
            }
        }
    );
}

async function codigoLeido(serieLimpia) {
    try {
        // Como ya viene validado y limpio desde los lectores, el código es directo
        serie.value = serieLimpia;
        serie.readOnly = true;
        serieEscaneada = true;

        if (navigator.vibrate) {
            navigator.vibrate(120);
        }

        confirmacionSerie.classList.remove("oculto");
        validarFormulario();
        detenerScanner(); // Cambiado para asegurar limpieza completa

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

// Alias por si usas este nombre en 'iniciarScanner'
function detenerTodoScanner() {
    detenerScanner();
}