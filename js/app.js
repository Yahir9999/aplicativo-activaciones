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
let serieEscaneada = false;

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
    try {
        const respuesta = await fetch(`${URL_SCRIPT}?action=catalogos`);
        const data = await respuesta.json();

        if (!data.ok) {
            mostrarMensaje("error", "No se pudieron cargar los catálogos.");
            return;
        }

        catalogos = data;

        llenarSelect(cedi, data.cedis, "CEDI", "CEDI");
        llenarDatalistModelos(data.modelos);

        cedi.addEventListener("change", () => {
            cargarActivadoresPorCedi();
            cargarAgenciasPorCedi();
            validarFormulario();
        });

    } catch (error) {
        console.error(error);
        mostrarMensaje("error", "Error al cargar catálogos.");
    }
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

    const filtradas = catalogos.agencias.filter(item =>
        item.CEDI === cediSeleccionado
    );

    llenarSelect(agencia, filtradas, "AGENCIA", "AGENCIA");
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
    serie.readOnly = true;
    serieEscaneada = true;
    confirmacionSerie.classList.add("oculto");
    validarFormulario();
});

btnSerieNo.addEventListener("click", () => {
    serie.readOnly = false;
    serie.select();
    serie.focus();

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
    if (guardando) return;

    const litrosValor = Number(litros.value);

    if (litrosValor > 9 || litrosValor < 0 || isNaN(litrosValor)) {
        mostrarMensaje("error", "Los litros de gasolina deben ser de 0 a 9.");
        validarFormulario();
        return;
    }

    if (!serieEscaneada) {
        mostrarMensaje("error", "La serie debe capturarse mediante escaneo.");
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
        const respuesta = await fetch(
            `${URL_SCRIPT}?action=registrar`
            + `&modelo=${encodeURIComponent(datos.modelo)}`
            + `&serie=${encodeURIComponent(datos.serie)}`
            + `&to=${encodeURIComponent(datos.to)}`
            + `&litrosGasolina=${encodeURIComponent(datos.litrosGasolina)}`
            + `&fechaActivacion=${encodeURIComponent(datos.fechaActivacion)}`
            + `&agencia=${encodeURIComponent(datos.agencia)}`
            + `&cedi=${encodeURIComponent(datos.cedi)}`
            + `&tipoEstructura=${encodeURIComponent(datos.tipoEstructura)}`
            + `&activador=${encodeURIComponent(datos.activador)}`
        );

        const data = await respuesta.json();

        if (data.ok) {
            mostrarMensaje("exito", "Activación guardada correctamente.");
            limpiarFormulario();
        } else {
            mostrarMensaje("error", data.mensaje);
        }

    } catch (error) {
        console.error(error);
        mostrarMensaje("error", "Ocurrió un error al guardar la activación, vuelve a intentarlo.");
    }

    guardando = false;
    btnRegistrar.textContent = "Registrar activación";
    validarFormulario();
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

    serieEscaneada = false;

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

        if (!data.ok || !data.series || data.series.length === 0) {
            resultadoHistorial.innerHTML = `
                <div class="total-historial">
                    Total activadas: 0
                </div>
            `;
            return;
        }

        resultadoHistorial.innerHTML = `
            <div class="lista-series">
                ${data.series.map(serie => `<p>${serie}</p>`).join("")}
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