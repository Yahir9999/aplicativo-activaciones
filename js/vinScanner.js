const btnVinOCR = document.getElementById("btnVinOCR");

btnVinOCR.addEventListener("click", leerVINConOCR);

async function leerVINConOCR() {
    detenerTodoScanner();

    scannerActivo = true;
    lecturaProcesada = false;
    reader.style.display = "block";

    reader.innerHTML = `
        <div class="vin-ocr-box">
            <video id="videoVinOCR" autoplay muted playsinline style="width:100%; border-radius:12px;"></video>

            <div class="vin-guia" style="text-align:center; padding:10px; font-weight:bold;">
                Coloca la etiqueta del VIN dentro del recuadro
            </div>

            <button type="button" id="btnCapturarVIN" class="btn-capturar-vin" style="width:100%; padding:12px; margin-top:10px;">
                Capturar VIN
            </button>
        </div>
    `;

    const video = document.getElementById("videoVinOCR");
    const btnCapturarVIN = document.getElementById("btnCapturarVIN");

    try {
        // MEJORA 1: Forzamos Full HD (1080p) para garantizar bordes ultra definidos en las letras
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

        btnCapturarVIN.addEventListener("click", async () => {
            // Asegurarnos de que el video ya tenga dimensiones válidas
            if (video.videoWidth === 0 || video.videoHeight === 0) {
                mostrarMensaje("error", "La cámara aún se está inicializando. Intenta de nuevo.");
                return;
            }

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
                detenerTodoScanner();
            } else {
                mostrarMensaje("error", "No se pudo leer un VIN válido de Vento. Centra bien la etiqueta.");
                btnCapturarVIN.disabled = false;
                btnCapturarVIN.textContent = "Capturar VIN";
            }
        });

    } catch (error) {
        console.error("Error al abrir cámara VIN:", error);
        detenerTodoScanner();
        mostrarMensaje("error", "No se pudo abrir la cámara para leer el VIN.");
    }
}

async function procesarVIN(video) {
    const capturas = generarCapturasProcesadas(video);

    for (let i = 0; i < capturas.length; i++) {
        // MEJORA 2: Ejecutamos el OCR restringiendo el diccionario y el modo de segmento
        const resultado = await Tesseract.recognize(
            capturas[i],
            "eng",
            {
                tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
                tessedit_pageseg_mode: "7" // Trata el recorte estrictamente como una única línea de texto
            }
        );

        const texto = resultado.data.text || "";
        
        // ALINEACIÓN DIRECTA: Llama a la función principal de tu vinValidator.js
        const vin = validarVIN(texto);

        console.log("Intento:", i + 1, "Modo OCR:", i === 0 ? "Contraste" : i === 1 ? "Normal" : "Binarizado", "Texto Crudo:", texto.trim(), "VIN Validado:", vin);

        // Si tu validador matemático e interno da el visto bueno, regresamos el resultado de inmediato
        if (vin) return vin;
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

    // MEJORA 3: Reordenamos los intentos. Mandamos primero las versiones con filtro
    // porque Tesseract responde hasta un 60% más rápido si procesa Blanco/Negro puro.
    return [
        procesarImagen(recorte, "contraste"),
        procesarImagen(recorte, "binarizado"),
        procesarImagen(recorte, "normal")
    ];
}

function recortarZonaVIN(canvasOriginal) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const ancho = canvasOriginal.width;
    const alto = canvasOriginal.height;

    // MEJORA 4: Ajuste de recuadro horizontal estricto. Al reducir el alto del recorte
    // quitamos ruidos visuales de los bordes del motor o calcomanías secundarias.
    const cropX = ancho * 0.05;
    const cropY = alto * 0.38;
    const cropW = ancho * 0.90;
    const cropH = alto * 0.24;

    // Mantener un escalado controlado (2x) para darle tamaño legible a las letras sin colgar la RAM
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

    // Si es modo normal, devolvemos el canvas limpio sin iterar pixeles para ahorrar ciclos de CPU
    if (modo === "normal") {
        return canvas.toDataURL("image/png");
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        // Fórmula de luminancia de escala de grises estándar (BT.601) para mayor precisión
        let gris = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;

        if (modo === "contraste") {
            gris = gris > 115 ? 255 : 0;
        }

        if (modo === "binarizado") {
            gris = gris > 145 ? 255 : 0;
        }

        data[i] = gris;
        data[i + 1] = gris;
        data[i + 2] = gris;
    }

    ctx.putImageData(imageData, 0, 0);

    return canvas.toDataURL("image/png");
}

function detenerTodoScanner() {
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