const btnVinOCR = document.getElementById("btnVinOCR");

btnVinOCR.addEventListener("click", leerVINConOCR);

async function leerVINConOCR() {
    if (scannerActivo) detenerScanner();

    scannerActivo = true;
    lecturaProcesada = false;
    reader.style.display = "block";

    reader.innerHTML = `
        <div class="vin-ocr-box">
            <video id="videoVinOCR" autoplay muted playsinline></video>

            <div class="vin-guia">
                Coloca la etiqueta del VIN dentro del recuadrosigu
            </div>

            <button type="button" id="btnCapturarVIN" class="btn-capturar-vin">
                Capturar VIN
            </button>
        </div>
    `;

    const video = document.getElementById("videoVinOCR");
    const btnCapturarVIN = document.getElementById("btnCapturarVIN");

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

        btnCapturarVIN.addEventListener("click", async () => {
            btnCapturarVIN.disabled = true;
            btnCapturarVIN.textContent = "Leyendo VIN, no muevas la cámara...";

            mostrarMensaje("exito", "Leyendo VIN, mantén la cámara fija...");

            const vin = await procesarVIN(video);

            if (vin) {
                serie.value = vin;
                serie.readOnly = true;
                serieEscaneada = true;

                if (navigator.vibrate) navigator.vibrate(120);

                confirmacionSerie.classList.remove("oculto");
                validarFormulario();
                detenerScanner();

            } else {
                mostrarMensaje("error", "No se pudo leer un VIN válido. Acerca la cámara y centra solo el VIN.");
                btnCapturarVIN.disabled = false;
                btnCapturarVIN.textContent = "Capturar VIN";
            }
        });

    } catch (error) {
        console.error("Error al abrir cámara VIN:", error);
        detenerScanner();
        mostrarMensaje("error", "No se pudo abrir la cámara para leer el VIN.");
    }
}

async function procesarVIN(video) {
    const capturas = generarCapturasProcesadas(video);

    for (const imagen of capturas) {
        const resultado = await Tesseract.recognize(
            imagen,
            "eng",
            {
                tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
                tessedit_pageseg_mode: "7"
            }
        );

        const texto = resultado.data.text || "";
        const confianza = resultado.data.confidence || 0;
        const vin = validarVIN(texto);

        console.log("OCR:", texto, "VIN:", vin, "Confianza:", confianza);

        if (vin) {
            return vin;
        }
    }

    return null;
}


function generarCapturasProcesadas(video) {
    const baseCanvas = document.createElement("canvas");
    const baseCtx = baseCanvas.getContext("2d");

    baseCanvas.width = video.videoWidth;
    baseCanvas.height = video.videoHeight;

    baseCtx.drawImage(video, 0, 0, baseCanvas.width, baseCanvas.height);

    const recorte = recortarZonaVIN(baseCanvas);

    return [
        procesarImagen(recorte, "contraste"),
        procesarImagen(recorte, "normal")
    ];
}

function recortarZonaVIN(canvasOriginal) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const ancho = canvasOriginal.width;
    const alto = canvasOriginal.height;

    const cropX = ancho * 0.05;
    const cropY = alto * 0.30;
    const cropW = ancho * 0.90;
    const cropH = alto * 0.34;

    canvas.width = cropW * 2;
    canvas.height = cropH * 2;

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