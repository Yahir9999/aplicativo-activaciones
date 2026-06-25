// ==============================
// CONFIGURACIÓN
// ==============================

const VIN_REGEX = /^3MU[A-HJ-NPR-Z0-9]{14}$/;

// Valores ISO 3779
const VIN_VALUES = {
    A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,
    J:1,K:2,L:3,M:4,N:5,P:7,R:9,
    S:2,T:3,U:4,V:5,W:6,X:7,Y:8,Z:9,
    0:0,1:1,2:2,3:3,4:4,5:5,6:6,7:7,8:8,9:9
};

const VIN_WEIGHTS = [
    8,7,6,5,4,3,2,10,0,9,8,7,6,5,4,3,2
];

// ==============================
// FUNCIÓN PRINCIPAL
// ==============================

function validarVIN(textoOCR){

    const candidatos = obtenerCandidatos(textoOCR);

    if(candidatos.length===0){
        return null;
    }

    for(const vin of candidatos){

        if(validarDigitoVIN(vin)){
            console.log("VIN VALIDADO:",vin);
            return vin;
        }

    }

    return null;
}

// ==============================

function obtenerCandidatos(texto){

    let limpio = texto
        .toUpperCase()
        .replace(/\s+/g,"")
        .replace(/[^A-Z0-9]/g,"");

    limpio = limpiarOCR(limpio);

    const encontrados = limpio.match(/3MU[A-HJ-NPR-Z0-9]{14}/g);

    if(!encontrados){
        return [];
    }

    return [...new Set(encontrados)];
}

// ==============================

function limpiarOCR(texto){

    return texto

        .replace(/^[S5]MU/,"3MU")
        .replace(/^BMU/,"3MU")
        .replace(/^EMU/,"3MU");
}

// ==============================

function validarDigitoVIN(vin){

    if(!VIN_REGEX.test(vin)){
        return false;
    }

    let suma = 0;

    for(let i=0;i<17;i++){

        const caracter = vin[i];

        const valor = VIN_VALUES[caracter];

        if(valor===undefined){
            return false;
        }

        suma += valor * VIN_WEIGHTS[i];

    }

    const resto = suma % 11;

    const esperado = resto===10 ? "X" : resto.toString();

    return vin[8]===esperado;

}