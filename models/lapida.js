const mongoose = require("mongoose");

const LapidaSchema = new mongoose.Schema({
    NOM_REG: String,
    NOMBRE_PROPIE: String,
    LOTE: String,
    EDO_CONTRI: String,
    MEDIDAS: String,
    X: String,
    Y: String,
    CUENTA: String
});

module.exports = mongoose.model("Lapida", LapidaSchema);