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
    listaModelos.innerHTML = "";

    const modelosOrdenados = datos
        .map(item => item.MODELO)
        .filter(modelo => modelo !== "" && modelo !== undefined && modelo !== null)
        .sort((a, b) => String(a).localeCompare(String(b), "es"));

    modelosOrdenados.forEach(modelo => {
        const option = document.createElement("option");
        option.value = modelo;
        listaModelos.appendChild(option);
    });
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
        litrosValor <= 20;

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

    if (litrosValor > 20 || litrosValor < 0 || isNaN(litrosValor)) {
        mostrarMensaje("error", "Los litros de gasolina deben ser de 0 a 20.");
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