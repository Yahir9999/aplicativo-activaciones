let codeReader = null;
let controls = null;
let scannerActivo = false;

const btnScanner = document.getElementById("btnScanner");
const reader = document.getElementById("reader");

btnScanner.addEventListener("click", iniciarScanner);

async function iniciarScanner() {
    if (scannerActivo) return;

    scannerActivo = true;
    reader.style.display = "block";

    reader.innerHTML = `
        <video id="videoScanner" style="width:100%; border-radius:12px;"></video>
    `;

    const video = document.getElementById("videoScanner");

    try {
        codeReader = new ZXingBrowser.BrowserMultiFormatReader();

        controls = await codeReader.decodeFromVideoDevice(
            null,
            video,
            (result, error) => {
                if (result) {
                    codigoLeido(result.getText());
                }
            }
        );

    } catch (error) {
        console.error(error);

        scannerActivo = false;
        reader.style.display = "none";

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
            return;
        }

        serie.value = serieLimpia;
        serie.readOnly = true;
        serieEscaneada = true;

        confirmacionSerie.classList.remove("oculto");

        validarFormulario();

        detenerScanner();

    } catch (error) {
        console.error(error);
    }
}

function detenerScanner() {
    try {
        if (controls) {
            controls.stop();
            controls = null;
        }

        if (codeReader) {
            codeReader = null;
        }

        reader.innerHTML = "";
        reader.style.display = "none";
        scannerActivo = false;

    } catch (error) {
        console.error(error);
    }
}