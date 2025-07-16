const mongoose = require('mongoose');

const tramiteSchema = new mongoose.Schema({
    FECHA_ELA: {
        type: Date,
        default: Date.now
    },
    FOLIO: {
        type: String,
        required: true,
        unique: true
    },
    TITULAR: {
        type: String,
        required: true
    },
    INHUMACION: {
        type: String,
        default: ''
    },
    TRASPASO: {
        type: String,
        default: ''
    },
    RECIBO: {
        type: String,
        default: ''
    },
    COSTO_INHU: {
        type: String,
        default: ''
    },
    COSTO_EXHU: {
        type: String,
        default: ''
    },
    REPOSICION: {
        type: String,
        default: ''
    },
    COSTO_TRASPASO: {
        type: String,
        default: ''
    },
    LOTE: {
        type: String,
        default: ''
    },
    MANTENIMIENTO: {
        type: String,
        default: ''
    },
    AMPL_CM: {
        type: String,
        default: ''
    },
    REGULARIZACION: {
        type: String,
        default: ''
    },
    CONSTRUCCION: {
        type: String,
        default: ''
    },
    BUSQUEDA_INFO: {
        type: String,
        default: ''
    },
    FECHA_CREACION: {
        type: Date,
        default: Date.now
    },
    FECHA_ACTUALIZACION: {
        type: Date,
        default: Date.now
    }
});

tramiteSchema.pre('save', function(next) {
    this.FECHA_ACTUALIZACION = Date.now();
    next();
});

module.exports = mongoose.model('Tramite', tramiteSchema, 'tramites');