const fs = require("fs");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");

const content = fs.readFileSync("../../Docs/Fichadeinspeccion_panteon.docx", "binary");
const zip = new PizZip(content);
const doc = new Docxtemplater(zip);

const datosFormulario = {
    NO_FICHI: "12345",
    LOTE: "A-12",
    MEDIDAS: "2x3 m",
    INHU_CADA: "Juan Pérez",
    FECHA_INHU: "03 DE JUNIO DEL 2005",
    FOLIO: "F-001",
    HOJA: "H-01",
    CARAC_LOTE: "Lote limpio",
    ACTU_PROPIE: "María López",
    TELEFONO: "9616132547",
    SUR: "Calle Sur",
    NORTE: "Calle Norte",
    CONCEP: "Inspección general",
    OBSER: "Sin observaciones"
};

doc.setData(datosFormulario);
doc.render();

const buf = doc.getZip().generate({ type: "nodebuffer" });
fs.writeFileSync("Ficha_inspeccion_generada.docx", buf);
