// ==============================
// CONFIGURACIÓN
// ==============================

// Expresión regular estándar para la estructura de tu VIN de Vento
const VIN_REGEX = /^3MU[A-HJ-NPR-Z0-9]{14}$/;

// Valores ISO 3779 para el cálculo del dígito verificador
const VIN_VALUES = {
    A:1, B:2, C:3, D:4, E:5, F:6, G:7, H:8,
    J:1, K:2, L:3, M:4, N:5, P:7, R:9,
    S:2, T:3, U:4, V:5, W:6, X:7, Y:8, Z:9,
    0:0, 1:1, 2:2, 3:3, 4:4, 5:5, 6:6, 7:7, 8:8, 9:9
};

// Pesos posicionales ISO 3779
const VIN_WEIGHTS = [
    8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2
];

// ==============================
// FUNCIÓN PRINCIPAL
// ==============================

function validarVIN(textoOCR) {
    if (!textoOCR) return null;

    const candidatos = obtenerCandidatos(textoOCR);

    if (candidatos.length === 0) {
        return null;
    }

    // Evaluamos cada candidato encontrado tras la limpieza
    for (const vin of candidatos) {
        if (validarDigitoVIN(vin)) {
            console.log("VIN VALIDADO MATEMÁTICAMENTE:", vin);
            return vin; // Retorna el primer VIN 100% válido y real
        }
    }

    return null;
}

// ==============================
// PROCESAMIENTO Y BÚSQUEDA
// ==============================

function obtenerCandidatos(texto) {
    // 1. Limpieza agresiva de caracteres basura, espacios y saltos de línea
    let limpio = texto
        .toUpperCase()
        .replace(/\s+/g, "")
        .replace(/[^A-Z0-9]/g, "");

    // 2. Aplicar el corrector inteligente para el prefijo de Vento
    limpio = limpiarOCR(limpio);

    // 3. Buscar cualquier coincidencia continua de 17 caracteres que empiece con 3MU
    const encontrados = limpio.match(/3MU[A-HJ-NPR-Z0-9]{14}/g);

    if (!encontrados) {
        return [];
    }

    // Retornamos un array eliminando posibles duplicados del escaneo
    return [...new Set(encontrados)];
}

// ==============================
// CORRECTOR INTELIGENTE PARA VENTO (3MU)
// ==============================

function limpiarOCR(texto) {
    if (texto.length < 17) return texto;

    // Buscamos si en alguna parte del texto hay algo que se parezca a un VIN (17 caracteres seguidos)
    // El OCR a veces mete basura al inicio, así que intentamos aislar el bloque principal de 17.
    let bloqueVIN = texto;
    if (texto.length > 17) {
        // CORREGIDO: "coincidenciaFlexible" todo junto, sin espacios intermediarios
        const coincidenciaFlexible = texto.match(/[5SB8E3][NWHXBM][VO0QU][A-HJ-NPR-Z0-9]{14}/);
        
        if (coincidenciaFlexible) {
            bloqueVIN = coincidenciaFlexible[0];
        } else {
            // Fallback: si no encuentra el patrón flexible, toma los primeros 17 alfanuméricos
            bloqueVIN = texto.substring(0, 17);
        }
    }

    

    // Dividimos el bloque para reparar individualmente el prefijo de Vento
    let prefijo = bloqueVIN.substring(0, 3);
    const resto = bloqueVIN.substring(3);

    // Corrección posicional detallada:
    // Carácter 1: ¿Debería ser un '3'?
    if (/^[5SB8E]/.test(prefijo[0])) {
        prefijo = "3" + prefijo.substring(1);
    }

    // Carácter 2: ¿Debería ser una 'M'?
    if (/^[NWHX]/.test(prefijo[1])) {
        prefijo = prefijo[0] + "M" + prefijo.substring(2);
    }

    // Carácter 3: ¿Debería ser una 'U'?
    if (/^[VO0Q]/.test(prefijo[2])) {
        prefijo = prefijo.substring(0, 2) + "U";
    }

    // Reensamblamos el VIN corregido
    let textoCorregido = prefijo + resto;

    // Salvavidas final por expresiones regulares globales
    return textoCorregido
        .replace(/^[5SB8E]MU/, "3MU")
        .replace(/^3[NWHX]U/, "3MU")
        .replace(/^3M[VO0Q]/, "3MU");
}

// ==============================
// VALIDACIÓN MATEMÁTICA (DÍGITO VERIFICADOR)
// ==============================

function validarDigitoVIN(vin) {
    // Debe cumplir estrictamente con el formato final antes del cálculo matemático
    if (!VIN_REGEX.test(vin)) {
        return false;
    }

    let suma = 0;

    for (let i = 0; i < 17; i++) {
        const caracter = vin[i];
        const valor = VIN_VALUES[caracter];

        // Si por alguna razón hay un caracter inválido, se descarta
        if (valor === undefined) {
            return false;
        }

        suma += valor * VIN_WEIGHTS[i];
    }

    const resto = suma % 11;
    
    // Si el residuo es 10, el dígito verificador en la posición 9 (índice 8) debe ser una "X"
    const esperado = resto === 10 ? "X" : resto.toString();

    return vin[8] === esperado;
}