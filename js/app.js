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


const btnIncidenciaSi = document.getElementById("btnIncidenciaSi");
const btnIncidenciaNo = document.getElementById("btnIncidenciaNo");
const incidenciaPresentada = document.getElementById("incidenciaPresentada");
const contenedorIncidencia = document.getElementById("contenedorIncidencia");
const descripcionIncidencia = document.getElementById("descripcionIncidencia");


const contenedorReparaciones = document.getElementById("contenedorReparaciones");
const btnReparacionesSi = document.getElementById("btnReparacionesSi");
const btnReparacionesNo = document.getElementById("btnReparacionesNo");
const reparacionesPresentada = document.getElementById("reparacionesPresentada");



// Seleccionar SÍ en incidencia
btnIncidenciaSi.addEventListener("click", () => {
    incidenciaPresentada.value = "SI";

    contenedorIncidencia.classList.remove("oculto");
    contenedorReparaciones.classList.remove("oculto");

    descripcionIncidencia.required = true;

    btnIncidenciaSi.classList.add("seleccionado");
    btnIncidenciaNo.classList.remove("seleccionado");

    validarFormulario();
});

// Seleccionar NO en incidencia
btnIncidenciaNo.addEventListener("click", () => {
    incidenciaPresentada.value = "NO";

    contenedorIncidencia.classList.add("oculto");
    contenedorReparaciones.classList.add("oculto");

    descripcionIncidencia.required = false;
    descripcionIncidencia.value = "";

    // Limpiar la respuesta de Reparaciones
    reparacionesPresentada.value = "";
    btnReparacionesSi.classList.remove("seleccionado");
    btnReparacionesNo.classList.remove("seleccionado");

    btnIncidenciaNo.classList.add("seleccionado");
    btnIncidenciaSi.classList.remove("seleccionado");

    validarFormulario();
});

descripcionIncidencia.addEventListener("input", validarFormulario);

// Seleccionar SÍ en Reparaciones
btnReparacionesSi.addEventListener("click", () => {
    reparacionesPresentada.value = "SI";

    btnReparacionesSi.classList.add("seleccionado");
    btnReparacionesNo.classList.remove("seleccionado");

    validarFormulario();
});

// Seleccionar NO en Reparaciones
btnReparacionesNo.addEventListener("click", () => {
    reparacionesPresentada.value = "NO";

    btnReparacionesNo.classList.add("seleccionado");
    btnReparacionesSi.classList.remove("seleccionado");

    validarFormulario();
});






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

    let cacheValido = false;

    // ==========================================
    // 1. CARGAR CACHÉ INMEDIATAMENTE
    // ==========================================

    try {

        const cacheGuardado =
            localStorage.getItem(CACHE_KEY);

        if (cacheGuardado) {

            const cache =
                JSON.parse(cacheGuardado);

            const tiempoActual =
                Date.now();

            cacheValido =
                cache.data &&
                cache.timestamp &&
                (tiempoActual - cache.timestamp) < CACHE_TIME;

            if (cacheValido) {

                console.log(
                    "⚡ Catálogos cargados desde caché"
                );

                catalogos = cache.data;

                llenarSelect(
                    cedi,
                    cache.data.cedis,
                    "CEDI",
                    "CEDI"
                );

                llenarDatalistModelos(
                    cache.data.modelos
                );

                prepararCambioCedi();

            }

        }

    } catch (error) {

        console.warn(
            "No se pudo leer el caché:",
            error
        );

    }


    // ==========================================
    // 2. ACTUALIZAR EN SEGUNDO PLANO
    // ==========================================

    try {

        console.log(
            "🌐 Actualizando catálogos en segundo plano..."
        );

        const respuesta =
            await fetch(
                `${URL_SCRIPT}?action=catalogos`
            );

        if (!respuesta.ok) {
            throw new Error(
                `Error HTTP ${respuesta.status}`
            );
        }

        const data =
            await respuesta.json();

        if (!data.ok) {

            console.warn(
                "Apps Script no pudo actualizar los catálogos."
            );

            return;
        }


        // ==========================================
        // 3. GUARDAR VALORES ACTUALES
        // ==========================================

        const cediActual =
            cedi.value;

        const activadorActual =
            activador.value;

        const agenciaActual =
            agencia.value;

        const modeloActual =
            modelo.value;


        // ==========================================
        // 4. GUARDAR DATOS ACTUALIZADOS
        // ==========================================

        catalogos = data;

        try {

            localStorage.setItem(
                CACHE_KEY,
                JSON.stringify({
                    timestamp: Date.now(),
                    data: data
                })
            );

            console.log(
                "✓ Catálogos actualizados en segundo plano"
            );

        } catch (error) {

            console.warn(
                "No se pudo guardar el caché:",
                error
            );

        }


        // ==========================================
        // 5. ACTUALIZAR CEDI
        // ==========================================

        llenarSelect(
            cedi,
            data.cedis,
            "CEDI",
            "CEDI"
        );

        // Restaurar CEDI seleccionado
        if (
            cediActual &&
            data.cedis.some(
                item => item.CEDI === cediActual
            )
        ) {
            cedi.value = cediActual;
        }


        // ==========================================
        // 6. ACTUALIZAR MODELOS
        // ==========================================

        llenarDatalistModelos(
            data.modelos
        );

        modelo.value = modeloActual;


        // ==========================================
        // 7. ACTUALIZAR ACTIVADORES
        // ==========================================

        cargarActivadoresPorCedi();

        if (activadorActual) {

            const activadorExiste =
                data.usuarios.some(
                    item =>
                        item.CEDI === cediActual &&
                        item.ACTIVADOR === activadorActual
                );

            if (activadorExiste) {
                activador.value = activadorActual;
            }

        }


        // ==========================================
        // 8. ACTUALIZAR AGENCIAS
        // ==========================================

        cargarAgenciasPorCedi();

        agencia.value = agenciaActual;


        // ==========================================
        // 9. VOLVER A VALIDAR FORMULARIO
        // ==========================================

        validarFormulario();

        prepararCambioCedi();


        console.log(
            "✓ Catálogos sincronizados correctamente"
        );


    } catch (error) {

        console.warn(
            "⚠️ No se pudieron actualizar los catálogos:",
            error
        );

        // ==========================================
        // SI EXISTE CACHÉ, LA APP CONTINÚA
        // ==========================================

        if (cacheValido) {

            console.log(
                "⚡ Se continúa utilizando el caché."
            );

        } else {

            mostrarMensaje(
                "error",
                "No se pudieron cargar los catálogos."
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

    // Guardamos las opciones actuales
    input._opcionesBuscador = opciones;

    // Si este buscador ya tiene listeners,
    // solamente actualizamos sus opciones.
    if (input.dataset.buscadorActivo === "true") {
        return;
    }

    input.dataset.buscadorActivo = "true";

    input.addEventListener("input", () => {

        const texto =
            input.value.trim().toUpperCase();

        lista.innerHTML = "";

        if (texto === "") {
            lista.classList.add("oculto");
            return;
        }

        const opcionesActuales =
            input._opcionesBuscador || [];

        const coincidencias =
            opcionesActuales
                .filter(opcion =>
                    opcion.toUpperCase().includes(texto)
                )
                .slice(0, 10);

        if (coincidencias.length === 0) {
            lista.classList.add("oculto");
            return;
        }

        coincidencias.forEach(opcion => {

            const item =
                document.createElement("div");

            item.className =
                "opcion-buscador";

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
            litrosValor <= 9 &&
            incidenciaPresentada.value !== "" &&
            (
                incidenciaPresentada.value === "NO" ||
                (
                    incidenciaPresentada.value === "SI" &&
                    descripcionIncidencia.value.trim() !== "" &&
                    reparacionesPresentada.value !== ""
                )
            );

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


// ==============================
// UTILIDADES DE REGISTRO
// ==============================

function esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


function generarRequestId() {

    if (
        window.crypto &&
        typeof window.crypto.randomUUID === "function"
    ) {
        return window.crypto.randomUUID();
    }

    return (
        Date.now().toString(36) +
        "-" +
        Math.random().toString(36).substring(2, 12)
    );
}


// ==============================
// REGISTRAR ACTIVACIÓN
// ==============================

async function registrarActivacion() {

    // Evitar doble registro por doble clic
    if (guardando) return;


    // ==============================
    // VALIDAR LITROS
    // ==============================

    const litrosValor = Number(litros.value);

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


    // ==============================
    // VALIDAR SERIE
    // ==============================

    if (!serieConfirmada) {

        mostrarMensaje(
            "error",
            "Confirma la serie antes de registrar la activación."
        );

        return;
    }


    // ==============================
    // BLOQUEAR BOTÓN
    // ==============================

    guardando = true;

    btnRegistrar.disabled = true;
    btnRegistrar.textContent = "Guardando...";


    // ==============================
    // DATOS
    // ==============================

    
        const datos = {
            modelo: modelo.value.trim(),
            serie: serie.value
                .trim()
                .replace(/\s+/g, "")
                .toUpperCase(),
            to: to.value.trim(),
            litrosGasolina: litros.value.trim(),
            fechaActivacion: fecha.value,
            agencia: agencia.value.trim(),
            cedi: cedi.value.trim(),
            tipoEstructura: tipoEstructura.value.trim(),
            activador: activador.value.trim(),

            incidenciaFalla: incidenciaPresentada.value === "SI"
            ? descripcionIncidencia.value.trim()
            : "NO",

        reparacionesPresentada:
            incidenciaPresentada.value === "SI"
                ? reparacionesPresentada.value
                : "NO"
};



    // ==============================
    // REQUEST ID
    // ==============================

    /*
     * IMPORTANTE:
     *
     * El mismo requestId se conserva
     * durante todos los reintentos.
     *
     * Así Apps Script sabe que se trata
     * de la misma activación.
     */

    const requestId =
        generarRequestId();


    // ==============================
    // INTENTOS
    // ==============================

    const MAX_INTENTOS = 3;

    let ultimoError = null;


    try {

        for (
            let intento = 1;
            intento <= MAX_INTENTOS;
            intento++
        ) {

            console.log(
                `📤 Registro de activación - intento ${intento}/${MAX_INTENTOS}`,
                {
                    requestId,
                    serie: datos.serie
                }
            );


            try {

                // ==============================
                // CREAR FORMULARIO POST
                // ==============================

                const parametros =
                    new URLSearchParams({

                        action: "registrar",

                        requestId: requestId,

                        modelo: datos.modelo,

                        serie: datos.serie,

                        to: datos.to,

                        litrosGasolina:
                            datos.litrosGasolina,

                        fechaActivacion:
                            datos.fechaActivacion,

                        agencia:
                            datos.agencia,

                        cedi:
                            datos.cedi,

                        tipoEstructura:
                            datos.tipoEstructura,

                        activador:
                            datos.activador,

                        incidenciaFalla:
                            datos.incidenciaFalla,
                        
                         reparacionesPresentada: 
                            datos.reparacionesPresentada
                    });


                // ==============================
                // ENVIAR
                // ==============================

                const respuesta =
                    await fetch(
                        URL_SCRIPT,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/x-www-form-urlencoded;charset=UTF-8"
                            },

                            body:
                                parametros.toString(),

                            cache: "no-store"
                        }
                    );


                if (!respuesta.ok) {

                    throw new Error(
                        `Error HTTP ${respuesta.status}`
                    );
                }


                // ==============================
                // LEER RESPUESTA
                // ==============================

                const data =
                    await respuesta.json();


                console.log(
                    "📥 Respuesta Apps Script:",
                    data
                );


                // ==============================
                // REGISTRO CORRECTO
                // ==============================

                if (data.ok) {

                    mostrarMensaje(
                        "exito",
                        data.repetido
                            ? "La activación ya había sido registrada correctamente."
                            : "Activación guardada correctamente."
                    );

                    limpiarFormulario();

                    return;
                }


                // ==============================
                // SERIE DUPLICADA
                // ==============================

                if (data.duplicada) {

                    mostrarMensaje(
                        "error",
                        data.mensaje ||
                        "La serie ya estaba registrada."
                    );

                    return;
                }


                // ==============================
                // REINTENTAR
                // ==============================

                if (
                    data.reintentar ||
                    data.pendiente
                ) {

                    console.warn(
                        "⏳ Activación pendiente. Se reintentará."
                    );

                    ultimoError =
                        new Error(
                            data.mensaje ||
                            "Activación pendiente."
                        );

                    if (
                        intento <
                        MAX_INTENTOS
                    ) {

                        await esperar(
                            intento * 1000
                        );

                        continue;
                    }

                    break;
                }


                // ==============================
                // ERROR DEFINITIVO
                // ==============================

                mostrarMensaje(
                    "error",
                    data.mensaje ||
                    "No se pudo registrar la activación."
                );

                return;

            } catch (error) {

                ultimoError = error;

                console.error(
                    `❌ Error en intento ${intento}:`,
                    error
                );


                // ==============================
                // SI AÚN HAY INTENTOS
                // ==============================

                if (
                    intento <
                    MAX_INTENTOS
                ) {

                    mostrarMensaje(
                        "error",
                        `Reintentando guardar... (${intento}/${MAX_INTENTOS})`
                    );

                    await esperar(
                        intento * 1000
                    );

                    continue;
                }
            }
        }


        // ==============================
        // SE AGOTARON LOS INTENTOS
        // ==============================

        console.error(
            "❌ No se pudo completar el registro:",
            ultimoError
        );


        mostrarMensaje(
            "error",
            "No se pudo confirmar el registro. Intenta nuevamente sin cambiar los datos."
        );


    } finally {

        // ==============================
        // LIBERAR BOTÓN
        // ==============================

        guardando = false;

        btnRegistrar.textContent =
            "Registrar activación";

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

    // Restablecer incidencia
    incidenciaPresentada.value = "";
    descripcionIncidencia.value = "";
    descripcionIncidencia.required = false;

    contenedorIncidencia.classList.add("oculto");
    btnIncidenciaSi.classList.remove("seleccionado");
    btnIncidenciaNo.classList.remove("seleccionado");

    // Restablecer reparaciones
    reparacionesPresentada.value = "";
    contenedorReparaciones.classList.add("oculto");

    btnReparacionesSi.classList.remove("seleccionado");
    btnReparacionesNo.classList.remove("seleccionado");

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



const pantallaAcceso =
    document.getElementById("pantallaAcceso");

const btnAccesoActivador =
    document.getElementById("btnAccesoActivador");

const btnAccesoJefe =
    document.getElementById("btnAccesoJefe");

const pantallaFormulario =
    document.getElementById("pantallaFormulario");

const pantallaHistorial =
    document.getElementById("pantallaHistorial");



const btnMenu = document.getElementById("btnMenu");
const menuOpciones = document.getElementById("menuOpciones");
const btnHistorial = document.getElementById("btnHistorial");
const btnVolverFormulario = document.getElementById("btnVolverFormulario");


const filtrosHistorialActivador = document.getElementById("filtrosHistorialActivador");
const filtrosHistorialJefe = document.getElementById("filtrosHistorialJefe");


const selectorJefe = document.getElementById("selectorJefe");


const historialCediActivador = document.getElementById("historialCediActivador");
const historialTecnicoActivador = document.getElementById("historialTecnicoActivador");
const historialFechaInicioActivador = document.getElementById("historialFechaInicioActivador");
const historialFechaFinActivador = document.getElementById("historialFechaFinActivador");
const btnBuscarHistorialActivador = document.getElementById("btnBuscarHistorialActivador");
const resultadoHistorialActivador = document.getElementById("resultadoHistorialActivador");


const historialTecnico = document.getElementById("historialTecnico");
const historialFechaInicio = document.getElementById("historialFechaInicio");
const historialFechaFin = document.getElementById("historialFechaFin");

const historialModeloJefe =  document.getElementById("historialModeloJefe");

const listaModelosHistorialJefe = document.getElementById("listaModelosHistorialJefe");
const btnBuscarHistorial = document.getElementById("btnBuscarHistorial");
const resultadoHistorial = document.getElementById("resultadoHistorial");

const tituloHistorial = document.getElementById("tituloHistorial");

let rolHistorialActual = "";
let cediJefeActual = "";


 // ==========================================
 // ACCESO PRINCIPAL
 // ==========================================

btnAccesoActivador.addEventListener("click", () => {
    rolHistorialActual = "ACTIVADOR";

    pantallaAcceso.classList.add("oculto");
    pantallaHistorial.classList.add("oculto");
    pantallaFormulario.classList.remove("oculto");
});

btnAccesoJefe.addEventListener("click", () => {
    rolHistorialActual = "JEFE";

    pantallaAcceso.classList.add("oculto");
    pantallaFormulario.classList.add("oculto");
    pantallaHistorial.classList.remove("oculto");

    filtrosHistorialActivador.classList.add("oculto");
    filtrosHistorialJefe.classList.remove("oculto");

    tituloHistorial.textContent = "Historial de activaciones";

    prepararHistorialJefe();
});

// ==========================================
// MENÚ
// ==========================================

btnMenu.addEventListener("click", () => {
    menuOpciones.style.display =
        menuOpciones.style.display === "block"
            ? "none"
            : "block";
});

// ==========================================
// ABRIR HISTORIAL DEL ACTIVADOR
// ==========================================

btnHistorial.addEventListener("click", () => {
    rolHistorialActual = "ACTIVADOR";

    menuOpciones.style.display = "none";
    pantallaFormulario.classList.add("oculto");
    pantallaHistorial.classList.remove("oculto");

    filtrosHistorialJefe.classList.add("oculto");
    filtrosHistorialActivador.classList.remove("oculto");

    tituloHistorial.textContent = "Mi historial de activaciones";

    prepararHistorialActivador();
});

// ==========================================
// VOLVER
// ==========================================

btnVolverFormulario.addEventListener("click", () => {
    pantallaHistorial.classList.add("oculto");
    resultadoHistorial.innerHTML = "";
    resultadoHistorialActivador.innerHTML = "";

    if (rolHistorialActual === "JEFE") {
        pantallaAcceso.classList.remove("oculto");
    } else {
        pantallaFormulario.classList.remove("oculto");
    }
});

// ==========================================
// CAMBIO DE CEDI DEL ACTIVADOR
// ==========================================

historialCediActivador.addEventListener("change", () => {
    cargarTecnicosHistorial();
    resultadoHistorialActivador.innerHTML = "";
});

// ==========================================
// BOTONES DE BÚSQUEDA
// ==========================================

btnBuscarHistorialActivador.addEventListener(
    "click",
    buscarHistorialActivador
);

btnBuscarHistorial.addEventListener(
    "click",
    buscarHistorial
);


selectorJefe.addEventListener("change", () => {
    const nombreSeleccionado = selectorJefe.value;

    const jefeSeleccionado = catalogos.usuarios.find(item =>
        String(item.ACTIVADOR || "").trim() === nombreSeleccionado &&
        String(item.ROL || "").trim().toUpperCase() ===
        "JEFE DE ACTIVACIONES"
    );

    cediJefeActual = jefeSeleccionado
        ? String(jefeSeleccionado.CEDI || "").trim()
        : "";

    historialTecnico.value = "";
    resultadoHistorial.innerHTML = "";

    const listaActivadoresJefe =
        document.getElementById("listaActivadoresJefe");

    listaActivadoresJefe.innerHTML = "";

    if (!cediJefeActual) return;

    const activadoresJefe = catalogos.usuarios.filter(item =>
        String(item.CEDI || "").trim().toUpperCase() ===
            cediJefeActual.toUpperCase() &&
        String(item.ROL || "").trim().toUpperCase() === "ACTIVADOR"
    );

    activadoresJefe.forEach(item => {
        const nombre = String(item.ACTIVADOR || "").trim();
        if (!nombre) return;

        const opcion = document.createElement("option");
        opcion.value = nombre;
        listaActivadoresJefe.appendChild(opcion);
    });
});




 // ==========================================
 // CARGAR FILTROS DEL ACTIVADOR
 // ==========================================

function prepararHistorialActivador() {
    if (!catalogos.cedis || !catalogos.usuarios) return;

    filtrosHistorialActivador.classList.remove("oculto");
    filtrosHistorialJefe.classList.add("oculto");

    llenarSelect(
        historialCediActivador,
        catalogos.cedis,
        "CEDI",
        "CEDI"
    );

    historialCediActivador.value = cedi.value || "";

    if (!historialCediActivador.value) {
        historialCediActivador.value = "";
    }

    cargarTecnicosHistorial();

    historialTecnicoActivador.value = "";

    establecerFechasHistorial(
        historialFechaInicioActivador,
        historialFechaFinActivador
    );

    resultadoHistorialActivador.innerHTML = "";
}

// ==========================================
// CARGAR FILTROS DEL JEFE
// ==========================================


function prepararHistorialJefe() {
    if (!catalogos.usuarios) return;

    filtrosHistorialJefe.classList.remove("oculto");
    filtrosHistorialActivador.classList.add("oculto");

    // Obtener únicamente los usuarios que tienen rol de jefe
    const jefes = catalogos.usuarios.filter(item =>
        String(item.ROL || "").trim().toUpperCase() ===
        "JEFE DE ACTIVACIONES" &&
        String(item.ACTIVADOR || "").trim() !== "" &&
        String(item.CEDI || "").trim() !== ""
    );

    // Preparar selector de jefes
    selectorJefe.innerHTML =
        '<option value="">Selecciona tu nombre</option>';

    jefes.forEach(jefe => {
        const opcion = document.createElement("option");
        opcion.value = String(jefe.ACTIVADOR).trim();
        opcion.textContent =
            `${String(jefe.ACTIVADOR).trim()} — ${String(jefe.CEDI).trim()}`;

        selectorJefe.appendChild(opcion);
    });

    // Limpiar filtros y resultados
    cediJefeActual = "";
    historialTecnico.value = "";
    resultadoHistorial.innerHTML = "";

    establecerFechasHistorial(
        historialFechaInicio,
        historialFechaFin
    );

    // Cargar modelos disponibles para el filtro del jefe
listaModelosHistorialJefe.innerHTML = "";

const modelosHistorial = [
    ...new Set(
        (catalogos.modelos || [])
            .map(item => String(item.MODELO || "").trim())
            .filter(Boolean)
    )
].sort((a, b) => a.localeCompare(b, "es"));

modelosHistorial.forEach(nombreModelo => {
    const opcion = document.createElement("option");
    opcion.value = nombreModelo;
    listaModelosHistorialJefe.appendChild(opcion);
});

historialModeloJefe.value = "";
}



// ==========================================
// ESTABLECER FECHAS DEL MES ACTUAL
// ==========================================

function establecerFechasHistorial(inputInicio, inputFin) {
    const hoy = new Date();

    const primerDia = new Date(
        hoy.getFullYear(),
        hoy.getMonth(),
        1
    );

    const ultimoDia = new Date(
        hoy.getFullYear(),
        hoy.getMonth() + 1,
        0
    );

    function formatoFechaHistorial(fecha) {
        const yyyy = fecha.getFullYear();
        const mm = String(fecha.getMonth() + 1).padStart(2, "0");
        const dd = String(fecha.getDate()).padStart(2, "0");

        return `${yyyy}-${mm}-${dd}`;
    }

    inputInicio.value = formatoFechaHistorial(primerDia);
    inputFin.value = formatoFechaHistorial(ultimoDia);
}

// ==========================================
// CARGAR ACTIVADORES POR CEDI
// ==========================================

function cargarTecnicosHistorial() {
    if (!catalogos.usuarios) return;

    const cediSeleccionado = historialCediActivador.value;

    const tecnicos = catalogos.usuarios.filter(item =>
        item.CEDI === cediSeleccionado &&
        String(item.ROL || "").trim().toUpperCase() !==
            "JEFE DE ACTIVACIONES"
    );

    llenarSelect(
        historialTecnicoActivador,
        tecnicos,
        "ACTIVADOR",
        "ACTIVADOR"
    );

    historialTecnicoActivador.options[0].textContent =
        "Todos los activadores";
}



 // ==========================================
 // BUSCAR HISTORIAL DEL ACTIVADOR
 // ==========================================

async function buscarHistorialActivador() {
    await consultarHistorial(
        historialCediActivador.value,
        historialTecnicoActivador.value,
        historialFechaInicioActivador.value,
        historialFechaFinActivador.value,
        resultadoHistorialActivador,
        false
    );
}

// ==========================================
// BUSCAR HISTORIAL DEL JEFE
// ==========================================


async function buscarHistorial() {
    if (!cediJefeActual) {
        resultadoHistorial.innerHTML =
            "<p>No se encontró el CEDI asignado al jefe.</p>";
        return;
    }

    await consultarHistorial(
        cediJefeActual,
        historialTecnico.value.trim(),
        historialFechaInicio.value,
        historialFechaFin.value,
        resultadoHistorial,
        true,
        historialModeloJefe.value.trim()
    );
}


// ==========================================
// CONSULTAR Y MOSTRAR HISTORIAL
// ==========================================

async function consultarHistorial(
    cediValor,
    tecnicoValor,
    fechaInicioValor,
    fechaFinValor,
    contenedor,
    mostrarEstado,
    modeloValor = ""
) {
    if (!cediValor) {
        contenedor.innerHTML = "<p>Selecciona un CEDI.</p>";
        return;
    }

    if (!fechaInicioValor || !fechaFinValor) {
        contenedor.innerHTML =
            "<p>Selecciona la fecha inicial y la fecha final.</p>";
        return;
    }

    if (fechaInicioValor > fechaFinValor) {
        contenedor.innerHTML =
            "<p>La fecha inicial no puede ser mayor que la fecha final.</p>";
        return;
    }

    contenedor.innerHTML = "<p>Buscando historial...</p>";

    try {
        const url =
            `${URL_SCRIPT}?action=historial` +
            `&cedi=${encodeURIComponent(cediValor)}` +
            `&activador=${encodeURIComponent(tecnicoValor)}` +
            `&fechaInicio=${encodeURIComponent(fechaInicioValor)}` +
            `&fechaFin=${encodeURIComponent(fechaFinValor)}` +
            `&modelo=${encodeURIComponent(mostrarEstado ? modeloValor : "")}`;

        const respuesta = await fetch(url, { cache: "no-store" });
        if (!respuesta.ok) {
            throw new Error(`Error HTTP ${respuesta.status}`);
        }

        const data = await respuesta.json();

        if (!data.ok) {
            contenedor.innerHTML =
                `<p>${data.mensaje || "No se pudo consultar el historial."}</p>`;
            return;
        }

        if (!data.registros || data.registros.length === 0) {
            contenedor.innerHTML = `
                <div class="total-historial">Total activaciones: 0</div>
            `;
            return;
        }

        const opcionesEstado = [
            "Express",
            "Por ticket",
            "Ticket informativo",
            "Finalizado"
        ];

        const filas = data.registros.map(item => {
            let celdaEstado = "";

            if (mostrarEstado) {
                const opciones = opcionesEstado.map(estado => `
                    <option value="${estado}"
                        ${item.estado === estado ? "selected" : ""}>
                        ${estado}
                    </option>
                `).join("");

                celdaEstado = `
                    <td>
                        <select
                            class="estado-historial"
                            data-cedi="${cediValor}"
                            data-hoja="${item.hoja || ""}"
                            data-fila="${item.fila || ""}"
                            data-serie="${item.serie || ""}"
                            aria-label="Estado de la activación">
                            <option value="">Seleccionar estado</option>
                            ${opciones}
                        </select>
                    </td>
                `;
            }

            return `
                <tr>
                    <td>${item.fecha || ""}</td>
                    <td>${item.modelo || ""}</td>
                    <td>${item.serie || ""}</td>
                    ${celdaEstado}
                </tr>
            `;
        }).join("");

        contenedor.innerHTML = `
            <div class="tabla-historial">
                <table>
                    <thead>
                        <tr>
                            <th>FECHA</th>
                            <th>MODELO</th>
                            <th>NÚMERO DE SERIE</th>
                            ${mostrarEstado ? "<th>ESTADO</th>" : ""}
                        </tr>
                    </thead>
                    <tbody>${filas}</tbody>
                </table>
            </div>
            <div class="total-historial">
                Total activaciones: ${data.total}
            </div>
        `;

        if (mostrarEstado) {
            contenedor.querySelectorAll(".estado-historial")
                .forEach(select => {
                    select.addEventListener("change", guardarEstadoActivacion);
                });
        }

    } catch (error) {
        console.error("Error al consultar historial:", error);
        contenedor.innerHTML =
            "<p>Error al consultar historial. Revisa la consola para más detalles.</p>";
    }
}

// ==========================================
// GUARDAR ESTADO EN LA COLUMNA J
// ==========================================

async function guardarEstadoActivacion(evento) {
    const select = evento.target;
    const estado = select.value;

    if (!estado) return;

    if (!select.dataset.hoja || !select.dataset.fila) {
        alert("Faltan los datos de la fila. Verifica Code.gs.");
        return;
    }

    select.disabled = true;

    try {
        const parametros = new URLSearchParams({
            action: "actualizarEstado",
            cedi: select.dataset.cedi,
            hoja: select.dataset.hoja,
            fila: select.dataset.fila,
            serie: select.dataset.serie,
            estado: estado
        });

        const respuesta = await fetch(URL_SCRIPT, {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/x-www-form-urlencoded;charset=UTF-8"
            },
            body: parametros.toString(),
            cache: "no-store"
        });

        const data = await respuesta.json();

        if (!data.ok) {
            throw new Error(data.mensaje || "No se pudo guardar el estado.");
        }

        console.log("Estado actualizado:", data.mensaje);

    } catch (error) {
        console.error("Error al guardar estado:", error);
        alert("No se pudo guardar el estado. Intenta nuevamente.");
    } finally {
        select.disabled = false;
    }
}
