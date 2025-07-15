const mongoose = require("mongoose");

const HistorialSchema = new mongoose.Schema({
    NOM_REG: {
        type: String,
        required: true,
        index: true
    },
    datos_anteriores: {
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
        CUENTA: String
    },
    datos_nuevos: {
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
        CUENTA: String
    },
    // Metadatos del cambio
    fecha_cambio: {
        type: Date,
        default: Date.now
    },
    usuario_cambio: {
        type: String,
        default: "admin"
    },
    tipo_operacion: {
        type: String,
        enum: ['UPDATE', 'CREATE', 'DELETE'],
        default: 'UPDATE'
    },
    campos_modificados: [{
        campo: String,
        valor_anterior: String,
        valor_nuevo: String
    }],
    observaciones: String
});

// Índices para optimizar consultas
HistorialSchema.index({ NOM_REG: 1, fecha_cambio: -1 });

module.exports = mongoose.model("Historial", HistorialSchema);