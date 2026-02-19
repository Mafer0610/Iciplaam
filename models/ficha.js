const mongoose = require('mongoose');

const fichaSchema = new mongoose.Schema({
    NO_FICHI:       String,
    LOTE_ACT:       String,
    MEDIDAS:        String,
    INHU_CADA:      String,
    FECHA_INHU:     Date,
    FECHA_FICHA:    Date,       
    FOLIO:          String,
    HOJA:           String,
    ACTU_PROPIE:    String,
    TELEFONO:       String,
    CARAC_LOTE:     String,
    SUR:            String,
    NORTE:          String,
    CONCEPTOS:      [String],
    OBSER:          String,

    NOMBRE_INHUMADO: String,    

    TIPO_TRASPASO:   {
        type: String,
        enum: ['ENTRE_FAMILIARES', 'ENTRE_TERCEROS', ''],
        default: ''
    },
    NOMBRE_CEDENTE:  String,    
    NOMBRE_RECEPTOR: String,    

    RAZON_BOLETA: {
        type: String,
        enum: ['EXTRAVIO', 'ACTUALIZACION_DATOS', ''],
        default: ''
    },
    TIPO_ACTUALIZACION:    [String],
    DETALLES_ACTUALIZACION: {
        type: Map,
        of: String,
        default: {}
    },

    PERSONAS_EXHUMACION: [{
        nombre:           { type: String, default: '' },
        fecha_inhumacion: { type: String, default: '' }
    }],

    PERSONAS_DEPOSITO: [{
        nombre:          { type: String, default: '' },
        fecha_defuncion: { type: String, default: '' }
    }],

    FECHA_CREACION:     { type: Date, default: Date.now },
    FECHA_ACTUALIZACION:{ type: Date, default: Date.now },
    ESTADO: {
        type: String,
        enum: ['COMPLETO', 'INCOMPLETO'],
        default: 'COMPLETO'
    }
});

module.exports = mongoose.model('Ficha', fichaSchema, 'docs');