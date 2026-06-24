let html5QrCode = null;
let scannerActivo = false;

const btnScanner = document.getElementById("btnScanner");
const reader = document.getElementById("reader");

btnScanner.addEventListener("click", iniciarScanner);

async function iniciarScanner() {
    if (scannerActivo) return;

    scannerActivo = true;
    reader.style.display = "block";

    html5QrCode = new Html5Qrcode("reader");

    try {
        await html5QrCode.start(
            {
                facingMode: "environment"
            },
            {
                fps: 20,

                qrbox: {
                    width: 380,
                    height: 220
                },

                aspectRatio: 1.777,

                videoConstraints: {
                    facingMode: "environment",
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },

                formatsToSupport: [
                    Html5QrcodeSupportedFormats.CODE_128,
                    Html5QrcodeSupportedFormats.CODE_39,
                    Html5QrcodeSupportedFormats.CODE_93
                ]
            },
            codigoLeido
        );

        // Zoom automático si el celular lo permite
        setTimeout(async () => {
            try {
                const capabilities = html5QrCode.getRunningTrackCapabilities();

                if (capabilities && capabilities.zoom) {
                    await html5QrCode.applyVideoConstraints({
                        advanced: [{ zoom: 2 }]
                    });
                }
            } catch (e) {
                console.warn("Zoom no disponible en este dispositivo");
            }
        }, 800);

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

        await html5QrCode.stop();
        await html5QrCode.clear();

        reader.style.display = "none";
        scannerActivo = false;

    } catch (error) {
        console.error(error);
    }
}