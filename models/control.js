const mongoose = require('mongoose');

const controlSchema = new mongoose.Schema({
    NOMB_CONTRI: String,
    DIRECCION: String,
    UBICACION_LOTE: String,
    MEDIDA_TRAMITE: String,
    TIPO_TRAMITE: [String], // Array para múltiples tipos
    DOCUMENTOS_ENTREGADOS: [String], // Array para múltiples documentos
    OTROS: String,
    FECHA_CREACION: { type: Date, default: Date.now },
    FECHA_ACTUALIZACION: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Control', controlSchema, 'control');