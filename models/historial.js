const mongoose = require("mongoose");

const CambioSchema = new mongoose.Schema({
    fecha_cambio: {
        type: Date,
        default: Date.now
    },
    usuario: {
        type: String,
        default: "Sistema"
    },
    tipo_operacion: {
        type: String,
        enum: ['CREACION', 'MODIFICACION'],
        default: 'MODIFICACION'
    },
    campos_modificados: [{
        campo: String,
        valor_anterior: String,
        valor_nuevo: String
    }]
});

const LapidaSchema = new mongoose.Schema({
    NOM_REG: String,
    NOMBRE_PROPIE: String,
    DIRECCION: String,
    UBICACION: String,
    LOTE: String,
    MEDIDAS_NO: String,
    EDO_CONTRI: String,
    COLONIA: String,
    MEDIDAS: String,
    LOTES_A: String,
    ZONA: String,
    FILA: String,
    RUTA: String,
    X: String,
    Y: String,
    CVE_POB: String,
    CVE_PANTEO: String,
    CVE_ZONA: String,
    CVE_LOTE: String,
    CUENTA: String,
    // HISTORIAL INTEGRADO
    historial: [CambioSchema]
});

module.exports = mongoose.model("Lapida", LapidaSchema);