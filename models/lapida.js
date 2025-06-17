const mongoose = require("mongoose");

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
    CUENTA: String
});

module.exports = mongoose.model("Lapida", LapidaSchema);