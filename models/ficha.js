const mongoose = require('mongoose');

const fichaSchema = new mongoose.Schema({
    NO_FICHI: String,
    LOTE_ACT: String,
    MEDIDAS: String,
    INHU_CADA: String,
    FECHA_INHU: Date,
    FOLIO: String,
    HOJA: String,
    ACTU_PROPIE: String,
    TELEFONO: String,
    CARAC_LOTE: String,
    SUR: String,
    NORTE: String,
    CONCEPTOS: [String],
    OBSER: String,
    FECHA_CREACION: { type: Date, default: Date.now },
    FECHA_ACTUALIZACION: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ficha', fichaSchema, 'docs');