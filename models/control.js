const mongoose = require('mongoose');

const controlSchema = new mongoose.Schema({
    NOMB_CONTRI: String,
    DIRECCION: String,
    UBICACION_LOTE: String,
    MEDIDA_TRAMITE: String,
    TIPO_TRAMITE: [String],
    DOCUMENTOS_ENTREGADOS: [String],
    OTROS: String,
    
    // ✨ NUEVO: Array para almacenar documentos subidos
    DOCUMENTOS_SUBIDOS: [{
        nombre_archivo: String,
        tipo_tramite: String, // 'INHUMACION', 'TRASPASO', etc.
        drive_file_id: String,
        drive_url: String,
        fecha_subida: {
            type: Date,
            default: Date.now
        },
        tamano: Number, // en bytes
        tipo_mime: String
    }],
    
    FECHA_CREACION: { 
        type: Date, 
        default: Date.now 
    },
    FECHA_ACTUALIZACION: { 
        type: Date, 
        default: Date.now 
    },
    ESTADO: {
        type: String,
        enum: ['COMPLETO', 'INCOMPLETO'],
        default: 'COMPLETO'
    }
});

module.exports = mongoose.model('Control', controlSchema, 'control');