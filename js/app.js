// ==============================
// CONFIGURACIÓN
// ==============================

const URL_SCRIPT = "https://script.google.com/macros/s/AKfycby9r5JuyPxp0iCQmCpg_FlcSPerUb6LCvkZJBetpD-m9pGCD-i3Y2PoM2u4W3ZTrCmI/exec";

const TIPOS_ESTRUCTURA = [
    "MADERA",
    "METAL"
];

let catalogos = {};
let guardando = false;
let serieConfirmada = false;

// ==============================
// ELEMENTOS HTML
// ==============================

const cedi = document.getElementById("cedi");
const activador = document.getElementById("activador");
const fecha = document.getElementById("fecha");
const modelo = document.getElementById("modelo");
const serie = document.getElementById("serie");
const to = document.getElementById("to");
const litros = document.getElementById("litros");
const agencia = document.getElementById("agencia");
const tipoEstructura = document.getElementById("tipoEstructura");

const btnRegistrar = document.getElementById("btnRegistrar");
const mensaje = document.getElementById("mensaje");

const confirmacionSerie = document.getElementById("confirmacionSerie");
const btnSerieSi = document.getElementById("btnSerieSi");
const btnSerieNo = document.getElementById("btnSerieNo");
const listaModelos = document.getElementById("listaModelos");
const listaAgencias = document.getElementById("listaAgencias");
const inputSerie = document.getElementById("serie");
const btnEscribirSerie = document.getElementById("btnEscribirSerie");



btnEscribirSerie.addEventListener("click", () => {

    inputSerie.removeAttribute("readonly");

    inputSerie.value = "";

    serieConfirmada = false;

    confirmacionSerie.classList.add("oculto");

    inputSerie.focus();

});

inputSerie.addEventListener("blur", () => {

    const valor = inputSerie.value
        .trim()
        .replace(/\s+/g, "")
        .toUpperCase();

    inputSerie.value = valor;

    if (valor === "") {
        return;
    }

    if (!esVINValido(valor)) {
        mostrarMensaje(
            "error",
            "El VIN debe tener 17 caracteres válidos."
        );

        serieConfirmada = false;
        validarFormulario();
        return;
    }

    confirmacionSerie.classList.remove("oculto");

});


// ==============================
// INICIO
// ==============================

document.addEventListener("DOMContentLoaded", () => {
    colocarFechaActual();
    cargarTiposEstructura();
    cargarCatalogos();
    escucharCambios();
    validarFormulario();
});


// ==============================
// FECHA ACTUAL
// ==============================

function colocarFechaActual() {
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, "0");
    const dd = String(hoy.getDate()).padStart(2, "0");

    fecha.value = `${yyyy}-${mm}-${dd}`;
}


// ==============================
// TIPO DE ESTRUCTURA
// ==============================

function cargarTiposEstructura() {
    tipoEstructura.innerHTML = `<option value="">Seleccionar</option>`;

    TIPOS_ESTRUCTURA.forEach(tipo => {
        const option = document.createElement("option");
        option.value = tipo;
        option.textContent = tipo;
        tipoEstructura.appendChild(option);
    });
}


// ==============================
// CATÁLOGOS
// ==============================

async function cargarCatalogos() {

    const CACHE_KEY = "activaciones_catalogos";
    const CACHE_TIME = 1000 * 60 * 30; // 30 minutos

    // =====================================================
    // 1. INTENTAR CARGAR DESDE CACHÉ
    // =====================================================

    try {

        const cacheGuardado =
            localStorage.getItem(CACHE_KEY);

        if (cacheGuardado) {

            const cache =
                JSON.parse(cacheGuardado);

            const tiempoActual =
                Date.now();

            const cacheValido =
                (tiempoActual - cache.timestamp)
                < CACHE_TIME;


            if (cacheValido && cache.data) {

                console.log(
                    "⚡ Catálogos cargados desde caché"
                );

                catalogos =
                    cache.data;


                // CEDI
                llenarSelect(
                    cedi,
                    cache.data.cedis,
                    "CEDI",
                    "CEDI"
                );


                // MODELOS
                llenarDatalistModelos(
                    cache.data.modelos
                );


                /*
                    Importante:

                    El listener del CEDI se registra
                    solamente una vez.
                */

                prepararCambioCedi();

                /*
                    No hacemos return.

                    Continuamos abajo para actualizar
                    los datos en segundo plano.
                */
            }

        }

    } catch (error) {

        console.warn(
            "No se pudo leer el caché:",
            error
        );

    }


    // =====================================================
    // 2. ACTUALIZAR DESDE APPS SCRIPT
    // =====================================================

    try {

        const respuesta =
            await fetch(
                `${URL_SCRIPT}?action=catalogos`
            );


        const data =
            await respuesta.json();


        if (!data.ok) {

            /*
                Si ya tenemos datos del caché,
                no mostramos error al usuario.
            */

            if (!catalogos) {

                mostrarMensaje(
                    "error",
                    "No se pudieron cargar los catálogos."
                );

            }

            return;

        }


        // =================================================
        // 3. GUARDAR NUEVOS DATOS
        // =================================================

        catalogos =
            data;


        try {

            localStorage.setItem(

                CACHE_KEY,

                JSON.stringify({

                    timestamp: Date.now(),

                    data: data

                })

            );

            console.log(
                "✓ Catálogos actualizados y guardados en caché"
            );

        } catch (error) {

            console.warn(
                "No se pudo guardar el caché:",
                error
            );

        }


        // =================================================
        // 4. ACTUALIZAR INTERFAZ
        // =================================================

        llenarSelect(
            cedi,
            data.cedis,
            "CEDI",
            "CEDI"
        );


        llenarDatalistModelos(
            data.modelos
        );


        prepararCambioCedi();


    } catch (error) {

        console.error(
            "Error al actualizar catálogos:",
            error
        );


        /*
            Si los datos del caché ya estaban cargados,
            dejamos la aplicación funcionando.
        */

        if (!catalogos) {

            mostrarMensaje(
                "error",
                "Error al cargar catálogos."
            );

        }

    }

}


// =====================================================
// CAMBIO DE CEDI
// =====================================================

function prepararCambioCedi() {

    /*
        Evitamos agregar el mismo listener
        varias veces.
    */

    if (cedi.dataset.listenerActivo === "true") {
        return;
    }


    cedi.dataset.listenerActivo = "true";


    cedi.addEventListener(
        "change",
        () => {

            cargarActivadoresPorCedi();

            cargarAgenciasPorCedi();

            validarFormulario();

        }
    );

}

function llenarSelect(select, datos, campoValor, campoTexto) {
    select.innerHTML = `<option value="">Seleccionar</option>`;

    datos.forEach(item => {
        const option = document.createElement("option");
        option.value = item[campoValor];
        option.textContent = item[campoTexto];
        select.appendChild(option);
    });
}


//funcion para buscar agencia manualmente
// ==============================
// BUSCADOR
// ==============================

function activarBuscador(input, lista, opciones) {

    input.addEventListener("input", () => {

        const texto = input.value.trim().toUpperCase();

        lista.innerHTML = "";

        if (texto === "") {
            lista.classList.add("oculto");
            return;
        }

        const coincidencias = opciones
            .filter(opcion =>
                opcion.toUpperCase().includes(texto)
            )
            .slice(0, 10);

        if (coincidencias.length === 0) {
            lista.classList.add("oculto");
            return;
        }

        coincidencias.forEach(opcion => {

            const item = document.createElement("div");

            item.className = "opcion-buscador";
            item.textContent = opcion;

            item.onclick = () => {
                input.value = opcion;
                lista.innerHTML = "";
                lista.classList.add("oculto");
                validarFormulario();
            };

            lista.appendChild(item);

        });

        lista.classList.remove("oculto");

    });

    document.addEventListener("click", e => {

        if (
            !input.contains(e.target) &&
            !lista.contains(e.target)
        ) {
            lista.classList.add("oculto");
        }

    });

}



function cargarActivadoresPorCedi() {
    const cediSeleccionado = cedi.value;

    const filtrados = catalogos.usuarios.filter(item =>
        item.CEDI === cediSeleccionado
    );

    llenarSelect(activador, filtrados, "ACTIVADOR", "ACTIVADOR");
}

function cargarAgenciasPorCedi() {
    const cediSeleccionado = cedi.value;

    agencia.value = "";
    listaAgencias.innerHTML = "";
    listaAgencias.classList.add("oculto");

    const agenciasOrdenadas = catalogos.agencias
        .filter(item => item.CEDI === cediSeleccionado)
        .map(item => item.AGENCIA)
        .filter(nombre => nombre)
        .sort((a, b) => a.localeCompare(b, "es"));

    activarBuscador(
        agencia,
        listaAgencias,
        agenciasOrdenadas
    );
}

// funcion para que los  modelos se llenen solos
function llenarDatalistModelos(datos) {

    const modelosOrdenados = datos
        .map(item => item.MODELO)
        .filter(modelo => modelo)
        .sort((a, b) => a.localeCompare(b, "es"));

    activarBuscador(
        modelo,
        listaModelos,
        modelosOrdenados
    );

}

// ==============================
// VALIDACIONES
// ==============================

function validarFormulario() {
    if (guardando) {
        btnRegistrar.disabled = true;
        return;
    }

    const litrosValor = Number(litros.value);

    const valido =
    cedi.value.trim() !== "" &&
    activador.value.trim() !== "" &&
    fecha.value.trim() !== "" &&
    modelo.value.trim() !== "" &&
    serie.value.trim() !== "" &&
    serieConfirmada &&
    to.value.trim() !== "" &&
    agencia.value.trim() !== "" &&
    tipoEstructura.value.trim() !== "" &&
    litros.value.trim() !== "" &&
    !isNaN(litrosValor) &&
    litrosValor >= 0 &&
    litrosValor <= 9;

    btnRegistrar.disabled = !valido;
}

function escucharCambios() {
    const campos = [
        cedi,
        activador,
        fecha,
        modelo,
        serie,
        to,
        litros,
        agencia,
        tipoEstructura
    ];

    campos.forEach(campo => {
        campo.addEventListener("input", validarFormulario);
        campo.addEventListener("change", validarFormulario);
    });
}

btnSerieSi.addEventListener("click", () => {

    const valor = serie.value
        .trim()
        .replace(/\s+/g, "")
        .toUpperCase();

    serie.value = valor;

    if (valor === "") {
        mostrarMensaje(
            "error",
            "Ingresa un VIN antes de continuar."
        );
        return;
    }

    if (!esVINValido(valor)) {
        mostrarMensaje(
            "error",
            "El VIN debe tener 17 caracteres válidos."
        );
        return;
    }

    serie.readOnly = true;

    serieConfirmada = true;

    confirmacionSerie.classList.add("oculto");

    validarFormulario();

});

btnSerieNo.addEventListener("click", () => {

    serieConfirmada = false;

    serie.readOnly = false;

    serie.focus();
    serie.select();

    confirmacionSerie.classList.add("oculto");

    mostrarMensaje(
        "error",
        "Corrige la serie manualmente y continúa."
    );

    validarFormulario();

});


                // ==============================
                // REGISTRAR ACTIVACIÓN
                // ==============================

            btnRegistrar.addEventListener("click", registrarActivacion);

            async function registrarActivacion() {

                // Evitar doble registro
                if (guardando) return;

                const litrosValor = Number(litros.value);

                // Validar litros
                if (
                    litrosValor > 9 ||
                    litrosValor < 0 ||
                    isNaN(litrosValor)
                ) {
                    mostrarMensaje(
                        "error",
                        "Los litros de gasolina deben ser de 0 a 9."
                    );

                    validarFormulario();
                    return;
                }

                // Validar confirmación de serie
                if (!serieConfirmada) {
                    mostrarMensaje(
                        "error",
                        "Confirma la serie antes de registrar la activación."
                    );
                    return;
                }

                guardando = true;

                btnRegistrar.disabled = true;
                btnRegistrar.textContent = "Guardando...";

                const datos = {
                    modelo: modelo.value.trim(),
                    serie: serie.value.trim(),
                    to: to.value.trim(),
                    litrosGasolina: litros.value.trim(),
                    fechaActivacion: fecha.value,
                    agencia: agencia.value.trim(),
                    cedi: cedi.value.trim(),
                    tipoEstructura: tipoEstructura.value.trim(),
                    activador: activador.value.trim()
                };

                try {

                    // Crear parámetros de forma más limpia
                    const parametros = new URLSearchParams({
                        action: "registrar",
                        modelo: datos.modelo,
                        serie: datos.serie,
                        to: datos.to,
                        litrosGasolina: datos.litrosGasolina,
                        fechaActivacion: datos.fechaActivacion,
                        agencia: datos.agencia,
                        cedi: datos.cedi,
                        tipoEstructura: datos.tipoEstructura,
                        activador: datos.activador
                    });

                    const respuesta = await fetch(
                        `${URL_SCRIPT}?${parametros.toString()}`
                    );

                    if (!respuesta.ok) {
                        throw new Error(
                            `Error HTTP ${respuesta.status}`
                        );
                    }

                    const data = await respuesta.json();

                    if (data.ok) {

                        mostrarMensaje(
                            "exito",
                            "Activación guardada correctamente."
                        );

                        limpiarFormulario();

                    } else {

                        mostrarMensaje(
                            "error",
                            data.mensaje || "No se pudo registrar la activación."
                        );
                    }

                } catch (error) {

                    console.error(
                        "Error al registrar activación:",
                        error
                    );

                    mostrarMensaje(
                        "error",
                        "Ocurrió un error al guardar la activación, vuelve a intentarlo."
                    );

                } finally {

                    // Siempre liberar el bloqueo
                    guardando = false;

                    btnRegistrar.textContent = "Registrar activación";

                    validarFormulario();
                }
            }


// ==============================
// LIMPIAR FORMULARIO
// ==============================

function limpiarFormulario() {
    modelo.value = "";
    serie.value = "";
    to.value = "";
    litros.value = "";
    agencia.value = "";
    tipoEstructura.value = "";

    serieConfirmada = false;

    serie.readOnly = true;
    confirmacionSerie.classList.add("oculto");

    validarFormulario();
}


// ==============================
// MENSAJES
// ==============================

function mostrarMensaje(tipo, texto) {
    mensaje.className = `mensaje ${tipo}`;
    mensaje.textContent = texto;

    setTimeout(() => {
        mensaje.className = "mensaje";
        mensaje.textContent = "";
    }, 3500);
}

// ==============================
// HISTORIAL DE ACTIVACIONES
// ==============================

const pantallaFormulario = document.getElementById("pantallaFormulario");
const pantallaHistorial = document.getElementById("pantallaHistorial");

const btnMenu = document.getElementById("btnMenu");
const menuOpciones = document.getElementById("menuOpciones");
const btnHistorial = document.getElementById("btnHistorial");
const btnVolverFormulario = document.getElementById("btnVolverFormulario");

const historialCedi = document.getElementById("historialCedi");
const historialTecnico = document.getElementById("historialTecnico");
const historialPeriodo = document.getElementById("historialPeriodo");
const btnBuscarHistorial = document.getElementById("btnBuscarHistorial");
const resultadoHistorial = document.getElementById("resultadoHistorial");

btnMenu.addEventListener("click", () => {
    menuOpciones.style.display =
        menuOpciones.style.display === "block" ? "none" : "block";
});

btnHistorial.addEventListener("click", () => {
    menuOpciones.style.display = "none";

    pantallaFormulario.classList.add("oculto");
    pantallaHistorial.classList.remove("oculto");

    cargarFiltrosHistorial();
});

btnVolverFormulario.addEventListener("click", () => {
    pantallaHistorial.classList.add("oculto");
    pantallaFormulario.classList.remove("oculto");

    resultadoHistorial.innerHTML = "";
});

historialCedi.addEventListener("change", () => {
    cargarTecnicosHistorial();
    resultadoHistorial.innerHTML = "";
});

btnBuscarHistorial.addEventListener("click", buscarHistorial);

function cargarFiltrosHistorial() {
    if (!catalogos.cedis || !catalogos.usuarios) return;

    llenarSelect(historialCedi, catalogos.cedis, "CEDI", "CEDI");

    historialCedi.value = cedi.value || "";
    cargarTecnicosHistorial();

    historialTecnico.value = activador.value || "";
}

function cargarTecnicosHistorial() {
    const cediSeleccionado = historialCedi.value;

    const tecnicos = catalogos.usuarios.filter(item =>
        item.CEDI === cediSeleccionado
    );

    llenarSelect(historialTecnico, tecnicos, "ACTIVADOR", "ACTIVADOR");
}

async function buscarHistorial() {
    const cediValor = historialCedi.value;
    const tecnicoValor = historialTecnico.value;
    const periodoValor = historialPeriodo.value;

    if (!cediValor || !tecnicoValor) {
        resultadoHistorial.innerHTML = `
            <p>Selecciona CEDI y técnico.</p>
        `;
        return;
    }

    resultadoHistorial.innerHTML = `<p>Buscando historial...</p>`;

    try {
        const respuesta = await fetch(
            `${URL_SCRIPT}?action=historial`
            + `&cedi=${encodeURIComponent(cediValor)}`
            + `&activador=${encodeURIComponent(tecnicoValor)}`
            + `&periodo=${encodeURIComponent(periodoValor)}`
        );

        const data = await respuesta.json();

        if (!data.ok || !data.registros || data.registros.length === 0) {
            resultadoHistorial.innerHTML = `
                <div class="total-historial">
                    Total activadas: 0
                </div>
            `;
            return;
        }

        resultadoHistorial.innerHTML = `
    <div class="tabla-historial">
        <table>
            <thead>
                <tr>
                    <th>Serie</th>
                    <th>Modelo</th>
                    <th>Fecha</th>
                </tr>
            </thead>

            <tbody>
                ${data.registros.map(item => `
                    <tr>
                        <td>${item.serie}</td>
                        <td>${item.modelo}</td>
                        <td>${item.fecha}</td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    </div>

    <div class="total-historial">
        Total activadas: ${data.total}
    </div>
`;

    } catch (error) {
        console.error(error);
        resultadoHistorial.innerHTML = `
            <p>Error al consultar historial.</p>
        `;
    }
}