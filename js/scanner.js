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
            { facingMode: "environment" },
            {
                fps: 10,
                qrbox: {
                    width: 250,
                    height: 100
                }
            },
            codigoLeido
        );

    } catch (error) {

        console.error(error);

        scannerActivo = false;
        reader.style.display = "none";

        mostrarMensaje(
            "error",
            "No se pudo abrir la cámara."
        );

    }

}

async function codigoLeido(decodedText) {

    try {

        serie.value = decodedText.trim();

        serie.readOnly = true;

        serieEscaneada = true;

        confirmacionSerie.classList.remove("oculto");

        validarFormulario();

        await html5QrCode.stop();

        await html5QrCode.clear();

        reader.style.display = "none";

        scannerActivo = false;

    }

    catch (error) {

        console.error(error);

    }

}