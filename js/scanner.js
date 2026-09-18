let codeReader = null;
let controls = null;
let scannerActivo = false;
let lecturaProcesada = false;
let streamActivo = null;

const btnScanner = document.getElementById("btnScanner");
const reader = document.getElementById("reader");

btnScanner.addEventListener("click", iniciarScanner);


// =====================================================
// INICIAR SCANNER
// =====================================================

async function iniciarScanner() {

    detenerScanner();

    scannerActivo = true;
    lecturaProcesada = false;

    reader.style.display = "block";

    reader.innerHTML = `
        <div class="scanner-contenedor">

            <div class="scanner-video-wrapper">

                <video
                    id="videoScanner"
                    autoplay
                    muted
                    playsinline>
                </video>

                <div class="scanner-marco">

                    <div class="scanner-linea"></div>

                </div>

                <div class="scanner-instruccion">
                    Coloca el código de barras dentro del recuadro
                </div>

            </div>

            <div class="scanner-estado" id="scannerEstado">
                Buscando código...
            </div>

            <button
                type="button"
                id="btnCapturarOCR"
                class="btn-scan"
                style="margin-top:10px;">

                <span>LEER VIN POR TEXTO</span>

            </button>

        </div>
    `;

    const video = document.getElementById("videoScanner");

    const btnOCR = document.getElementById("btnCapturarOCR");

    if (btnOCR) {
        btnOCR.addEventListener("click", () => {

            if (typeof leerVINConOCR === "function") {
                leerVINConOCR();
            } else {
                mostrarMensaje(
                    "error",
                    "El lector OCR no está disponible."
                );
            }

        });
    }

    try {

        await iniciarScannerZXing(video);

    } catch (error) {

        console.error(
            "Error al abrir cámara:",
            error
        );

        detenerScanner();

        mostrarMensaje(
            "error",
            "No se pudo abrir la cámara."
        );
    }
}


// =====================================================
// ZXING
// =====================================================

async function iniciarScannerZXing(video) {

    if (typeof ZXingBrowser === "undefined") {

        mostrarMensaje(
            "error",
            "No se encontró ZXing Browser."
        );

        return;
    }


    const ZXingLib =
        typeof ZXing !== "undefined"
            ? ZXing
            : ZXingBrowser;


    const hints = new Map();


    // -------------------------------------------------
    // FORMATOS
    // -------------------------------------------------

    const BarcodeFormat =
        ZXingLib.BarcodeFormat ||
        ZXingBrowser.BarcodeFormat;


    const DecodeHintType =
        ZXingLib.DecodeHintType ||
        ZXingBrowser.DecodeHintType;


    /*
        IMPORTANTE:

        Antes solo teníamos CODE_128.

        Ahora permitimos varios formatos.
        CODE_39 es especialmente importante
        para tus etiquetas.
    */

    const formatos = [

        BarcodeFormat.CODE_39,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_93,
        BarcodeFormat.ITF,
        BarcodeFormat.CODABAR,
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E

    ].filter(Boolean);


    if (DecodeHintType.POSSIBLE_FORMATS) {

        hints.set(
            DecodeHintType.POSSIBLE_FORMATS,
            formatos
        );

    }


    if (DecodeHintType.TRY_HARDER) {

        hints.set(
            DecodeHintType.TRY_HARDER,
            true
        );

    }


    // -------------------------------------------------
    // READER
    // -------------------------------------------------

    codeReader =
        new ZXingBrowser.BrowserMultiFormatReader(
            hints,
            {
                delayBetweenScanAttempts: 80,
                delayBetweenScanSuccess: 500
            }
        );


    // -------------------------------------------------
    // CÁMARA
    // -------------------------------------------------

    const constraints = {

        video: {

            facingMode: {
                ideal: "environment"
            },

            width: {
                ideal: 1920,
                min: 1280
            },

            height: {
                ideal: 1080,
                min: 720
            },

            frameRate: {
                ideal: 30,
                min: 15
            }

        }

    };


    controls =
        await codeReader.decodeFromConstraints(

            constraints,

            video,

            async (result, error, ctrl) => {

                if (
                    !scannerActivo ||
                    lecturaProcesada
                ) {
                    return;
                }


                if (result) {

                    const textoOriginal =
                        result.getText();


                    console.log(
                        "Código detectado:",
                        textoOriginal
                    );


                    const serieLimpia =
                        limpiarSerie(textoOriginal);


                    console.log(
                        "Código limpio:",
                        serieLimpia
                    );


                    /*
                        Primero comprobamos que tenga
                        estructura de VIN.
                    */

                    const vin =
                        extraerVINDesdeCodigo(
                            serieLimpia
                        );


                    if (vin) {

                        lecturaProcesada = true;


                        actualizarEstadoScanner(
                            "✓ VIN detectado"
                        );


                        if (ctrl) {
                            ctrl.stop();
                        }


                        await codigoLeido(vin);

                    } else {

                        actualizarEstadoScanner(
                            "Código detectado, buscando VIN..."
                        );

                    }

                }

            }
        );


    // Esperamos a que la cámara esté lista
    setTimeout(() => {

        aplicarMejorasCamara(video);

    }, 800);
}


// =====================================================
// EXTRAER VIN
// =====================================================

function extraerVINDesdeCodigo(texto) {

    if (!texto) {
        return null;
    }


    /*
        Caso ideal:
        ZXing devuelve directamente el VIN.
    */

    if (
        /^[A-Z0-9]{17}$/.test(texto) &&
        texto.startsWith("3MU")
    ) {

        /*
            El código de barras ya viene correcto.
            Lo validamos matemáticamente.
        */

        if (
            typeof validarVINCompleto === "function"
        ) {

            const valido =
                validarVINCompleto(texto);

            if (valido) {
                return texto;
            }

        } else {

            if (
                typeof validarDigitoVIN === "function" &&
                validarDigitoVIN(texto)
            ) {
                return texto;
            }

        }

    }


    /*
        Buscar VIN dentro del resultado.
    */

    const coincidencia =
        texto.match(
            /3MU[A-HJ-NPR-Z0-9]{14}/
        );


    if (coincidencia) {

        const candidato =
            coincidencia[0];


        if (
            typeof validarDigitoVIN === "function" &&
            validarDigitoVIN(candidato)
        ) {

            return candidato;

        }

    }


    return null;
}


// =====================================================
// LIMPIAR RESULTADO
// =====================================================

function limpiarSerie(texto) {

    return String(texto || "")

        .trim()

        .replace(/\s+/g, "")

        .replace(
            /[^A-Z0-9]/gi,
            ""
        )

        .toUpperCase();

}

function esVINValido(valor) {
    return /^[A-HJ-NPR-Z0-9]{17}$/.test(
        String(valor || "").trim().toUpperCase()
    );
}


// =====================================================
// MEJORAS DE CÁMARA
// =====================================================

async function aplicarMejorasCamara(video) {

    try {

        const stream =
            video.srcObject;

        if (!stream) {
            return;
        }


        streamActivo = stream;


        const track =
            stream.getVideoTracks()[0];

        if (!track) {
            return;
        }


        const capabilities =
            track.getCapabilities
                ? track.getCapabilities()
                : {};


        const advanced = [];


        // -------------------------------------------------
        // ENFOQUE CONTINUO
        // -------------------------------------------------

        if (
            capabilities.focusMode &&
            capabilities.focusMode.includes(
                "continuous"
            )
        ) {

            advanced.push({
                focusMode: "continuous"
            });

        }


        // -------------------------------------------------
        // EXPOSICIÓN
        // -------------------------------------------------

        if (
            capabilities.exposureMode &&
            capabilities.exposureMode.includes(
                "continuous"
            )
        ) {

            advanced.push({
                exposureMode: "continuous"
            });

        }


        // -------------------------------------------------
        // ZOOM
        // -------------------------------------------------

        if (capabilities.zoom) {

            const zoomMin =
                capabilities.zoom.min || 1;

            const zoomMax =
                capabilities.zoom.max || 1;


            /*
                No forzamos demasiado zoom.

                Un zoom excesivo puede hacer que
                desaparezcan partes del código.
            */

            const zoomIdeal =
                Math.min(
                    zoomMin + 0.5,
                    zoomMax
                );


            if (zoomIdeal > zoomMin) {

                advanced.push({
                    zoom: zoomIdeal
                });

            }

        }


        if (advanced.length > 0) {

            await track.applyConstraints({
                advanced
            });

        }

    } catch (error) {

        console.warn(
            "No se pudieron aplicar mejoras de cámara:",
            error
        );

    }

}


// =====================================================
// ESTADO DEL SCANNER
// =====================================================

function actualizarEstadoScanner(texto) {

    const estado =
        document.getElementById(
            "scannerEstado"
        );


    if (estado) {
        estado.textContent = texto;
    }

}


// =====================================================
// CÓDIGO LEÍDO
// =====================================================

async function codigoLeido(serieLimpia) {

    try {

        serie.value =
            serieLimpia;

        serie.readOnly =
            true;


        /*
            Mantener compatibilidad
            con tu app actual.
        */

        if (
            typeof serieConfirmada !== "undefined"
        ) {

            serieConfirmada =
                false;

        }


        if (
            typeof serieEscaneada !== "undefined"
        ) {

            serieEscaneada =
                true;

        }


        if (navigator.vibrate) {

            navigator.vibrate([
                80,
                40,
                80
            ]);

        }


        confirmacionSerie.classList.remove(
            "oculto"
        );


        validarFormulario();


        detenerScanner();


    } catch (error) {

        console.error(
            "Error procesando lectura:",
            error
        );

        lecturaProcesada =
            false;

    }

}


// =====================================================
// DETENER SCANNER
// =====================================================

function detenerScanner() {

    try {

        if (controls) {

            controls.stop();

            controls = null;

        }


        if (streamActivo) {

            streamActivo
                .getTracks()
                .forEach(track =>
                    track.stop()
                );

            streamActivo = null;

        }


        if (
            codeReader &&
            codeReader.reset
        ) {

            codeReader.reset();

        }


        codeReader = null;


        reader.innerHTML = "";

        reader.style.display =
            "none";


        scannerActivo =
            false;

        lecturaProcesada =
            false;


    } catch (error) {

        console.error(
            "Error al detener scanner:",
            error
        );

    }

}


// =====================================================
// COMPATIBILIDAD
// =====================================================

function detenerTodoScanner() {

    detenerScanner();

}