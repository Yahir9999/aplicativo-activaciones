let codeReader = null;
let controls = null;
let scannerActivo = false;
let lecturaProcesada = false;

const btnScanner = document.getElementById("btnScanner");
const reader = document.getElementById("reader");

btnScanner.addEventListener("click", iniciarScanner);

async function iniciarScanner() {
    if (scannerActivo) return;

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

    } catch (error) {
        console.error("Error al abrir cámara:", error);
        detenerScanner();
        mostrarMensaje("error", "No se pudo abrir la cámara.");
    }
}

async function codigoLeido(decodedText) {
    try {
        const serieLimpia = decodedText
            .trim()
            .replace(/\s+/g, "")
            .toUpperCase();

        const vinValido = /^[A-HJ-NPR-Z0-9]{17}$/;

        if (!vinValido.test(serieLimpia)) {
            console.warn("Lectura rechazada:", serieLimpia);
            lecturaProcesada = false;
            return;
        }

        serie.value = serieLimpia;
        serie.readOnly = true;
        serieEscaneada = true;

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

        codeReader = null;
        reader.innerHTML = "";
        reader.style.display = "none";

        scannerActivo = false;
        lecturaProcesada = false;

    } catch (error) {
        console.error("Error al detener scanner:", error);
    }
}