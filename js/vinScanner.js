const btnVinOCR = document.getElementById("btnVinOCR");

let vinOCRActivo = false;
let vinOCRProcesando = false;
let intervaloVIN = null;

btnVinOCR.addEventListener("click", leerVINConOCR);

async function leerVINConOCR() {
    if (scannerActivo) detenerScanner();

    scannerActivo = true;
    vinOCRActivo = true;
    vinOCRProcesando = false;

    reader.style.display = "block";

    reader.innerHTML = `
        <div class="vin-ocr-box">
            <video id="videoVinOCR" autoplay muted playsinline></video>

            <div class="vin-guia">
                Coloca el VIN dentro del recuadro
            </div>

            <div class="vin-estado" id="vinEstado">
                Buscando VIN...
            </div>
        </div>
    `;

    const video = document.getElementById("videoVinOCR");

    try {
        streamActivo = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "environment",
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            }
        });

        video.srcObject = streamActivo;
        await video.play();

        mostrarMensaje("exito", "Apunta al VIN y mantén la cámara fija...");

        iniciarLecturaAutomaticaVIN(video);

    } catch (error) {
        console.error("Error al abrir cámara VIN:", error);
        detenerVINScanner();
        mostrarMensaje("error", "No se pudo abrir la cámara para leer el VIN.");
    }
}

function iniciarLecturaAutomaticaVIN(video) {
    intervaloVIN = setInterval(async () => {
        if (!vinOCRActivo || vinOCRProcesando) return;

        vinOCRProcesando = true;

        const vinEstado = document.getElementById("vinEstado");
        if (vinEstado) vinEstado.textContent = "Leyendo VIN...";

        try {
            const vin = await procesarVIN(video);

            if (vin) {
                serie.value = vin;
                serie.readOnly = true;
                serieEscaneada = true;

                if (navigator.vibrate) navigator.vibrate(120);

                confirmacionSerie.classList.remove("oculto");
                validarFormulario();

                mostrarMensaje("exito", "VIN leído correctamente.");
                detenerVINScanner();
                return;
            }

            if (vinEstado) vinEstado.textContent = "Buscando VIN...";
        } catch (error) {
            console.warn("No se pudo procesar VIN:", error);
            if (vinEstado) vinEstado.textContent = "Buscando VIN...";
        }

        vinOCRProcesando = false;

    }, 1800);
}

async function procesarVIN(video) {
    const capturas = generarCapturasProcesadas(video);
    const resultados = [];

    const lecturas = await Promise.all(
        capturas.map(imagen =>
            Tesseract.recognize(
                imagen,
                "eng",
                {
                    tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
                    tessedit_pageseg_mode: "7"
                }
            )
        )
    );

    for (const resultado of lecturas) {
        const texto = resultado.data.text || "";
        const confianza = resultado.data.confidence || 0;
        const vin = validarVIN(texto);

        console.log("OCR:", texto, "VIN validado:", vin, "Confianza:", confianza);

        if (vin && confianza >= 80) {
            return vin;
        }

        if (vin) {
            resultados.push({ vin, confianza });
        }
    }

    if (resultados.length === 0) return null;

    resultados.sort((a, b) => b.confianza - a.confianza);

    if (resultados[0].confianza < 55) {
        return null;
    }

    return resultados[0].vin;
}

function generarCapturasProcesadas(video) {
    const baseCanvas = document.createElement("canvas");
    const baseCtx = baseCanvas.getContext("2d");

    baseCanvas.width = video.videoWidth;
    baseCanvas.height = video.videoHeight;

    baseCtx.drawImage(video, 0, 0, baseCanvas.width, baseCanvas.height);

    const recorte = recortarZonaVIN(baseCanvas);

    return [
        procesarImagen(recorte, "normal"),
        procesarImagen(recorte, "contraste"),
        procesarImagen(recorte, "binarizado")
    ];
}

function recortarZonaVIN(canvasOriginal) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const ancho = canvasOriginal.width;
    const alto = canvasOriginal.height;

    const cropX = ancho * 0.08;
    const cropY = alto * 0.36;
    const cropW = ancho * 0.84;
    const cropH = alto * 0.28;

    canvas.width = cropW * 3;
    canvas.height = cropH * 3;

    ctx.drawImage(
        canvasOriginal,
        cropX,
        cropY,
        cropW,
        cropH,
        0,
        0,
        canvas.width,
        canvas.height
    );

    return canvas;
}

function procesarImagen(canvasOriginal, modo) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = canvasOriginal.width;
    canvas.height = canvasOriginal.height;

    ctx.drawImage(canvasOriginal, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        let gris = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;

        if (modo === "contraste") {
            gris = gris > 120 ? 255 : 0;
        }

        if (modo === "binarizado") {
            gris = gris > 150 ? 255 : 0;
        }

        data[i] = gris;
        data[i + 1] = gris;
        data[i + 2] = gris;
    }

    ctx.putImageData(imageData, 0, 0);

    return canvas.toDataURL("image/png");
}

function detenerVINScanner() {
    vinOCRActivo = false;
    vinOCRProcesando = false;

    if (intervaloVIN) {
        clearInterval(intervaloVIN);
        intervaloVIN = null;
    }

    detenerScanner();
}