const btnVinOCR = document.getElementById("btnVinOCR");

btnVinOCR.addEventListener("click", leerVINConOCR);

async function leerVINConOCR() {
    if (scannerActivo) {
        detenerScanner();
    }

    scannerActivo = true;
    lecturaProcesada = false;

    reader.style.display = "block";

    reader.innerHTML = `
        <div class="vin-ocr-box">
            <video
                id="videoVinOCR"
                autoplay
                muted
                playsinline
                style="width:100%; border-radius:12px;">
            </video>

            <div class="vin-guia">
                Coloca el VIN dentro del recuadro
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
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });

        video.srcObject = streamActivo;
        await video.play();

        btnCapturarVIN.addEventListener("click", async () => {
            btnCapturarVIN.disabled = true;
            btnCapturarVIN.textContent = "Leyendo VIN...";

            const vin = await procesarImagenVIN(video);

            if (vin) {
                serie.value = vin;
                serie.readOnly = true;
                serieEscaneada = true;

                if (navigator.vibrate) {
                    navigator.vibrate(120);
                }

                confirmacionSerie.classList.remove("oculto");
                validarFormulario();
                detenerScanner();

            } else {
                mostrarMensaje("error", "No se pudo leer un VIN válido. Intenta acercar más la cámara.");
                btnCapturarVIN.disabled = false;
                btnCapturarVIN.textContent = "Capturar VIN";
            }
        });

    } catch (error) {
        console.error("Error OCR VIN:", error);
        detenerScanner();
        mostrarMensaje("error", "No se pudo abrir la cámara para leer el VIN.");
    }
}

async function procesarImagenVIN(video) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imagenProcesada = preprocesarImagenVIN(canvas);

    const resultado = await Tesseract.recognize(
        imagenProcesada,
        "eng",
        {
            tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        }
    );

    const textoOCR = resultado.data.text || "";

    console.log("Texto OCR:", textoOCR);

    return extraerVIN(textoOCR);
}

function preprocesarImagenVIN(canvasOriginal) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = canvasOriginal.width;
    canvas.height = canvasOriginal.height;

    ctx.drawImage(canvasOriginal, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const gris = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;

        const contraste = gris > 140 ? 255 : 0;

        data[i] = contraste;
        data[i + 1] = contraste;
        data[i + 2] = contraste;
    }

    ctx.putImageData(imageData, 0, 0);

    return canvas.toDataURL("image/png");
}

function extraerVIN(textoOCR) {
    let limpio = textoOCR
        .toUpperCase()
        .replace(/\s+/g, "")
        .replace(/[^A-Z0-9]/g, "");

    limpio = limpio
        .replace(/^SMU/, "3MU")
        .replace(/^EMU/, "3MU")
        .replace(/^BMU/, "3MU");

    const coincidencia = limpio.match(/3MU[A-HJ-NPR-Z0-9]{14}/);

    if (!coincidencia) {
        return null;
    }

    const vin = coincidencia[0];

    if (vin.length !== 17) {
        return null;
    }

    return vin;
}