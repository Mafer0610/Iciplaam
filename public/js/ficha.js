const fs = require("fs");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const path = require("path");
class GeneradorDocumentos {
    constructor() {
        this.rutaPlantillas = "../../Docs/";
        this.rutaSalida = "./documentos_generados/";
        
        if (!fs.existsSync(this.rutaSalida)) {
            fs.mkdirSync(this.rutaSalida, { recursive: true });
        }
    }
    generarFichaInspeccion(datos) {
        try {
            const nombrePlantilla = "Fichadeinspeccion_panteon.docx";
            const rutaPlantilla = path.join(this.rutaPlantillas, nombrePlantilla);
            
            if (!fs.existsSync(rutaPlantilla)) {
                throw new Error(`La plantilla ${nombrePlantilla} no fue encontrada en ${rutaPlantilla}`);
            }
            const content = fs.readFileSync(rutaPlantilla, "binary");
            const zip = new PizZip(content);
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
            });
            if (datos.FECHA_INHU) {
                const fecha = new Date(datos.FECHA_INHU);
                const meses = [
                    "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
                    "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
                ];
                datos.FECHA_INHU = `${fecha.getDate()} DE ${meses[fecha.getMonth()]} DEL ${fecha.getFullYear()}`;
            }
            doc.setData(datos);
            doc.render();

            const buf = doc.getZip().generate({ type: "nodebuffer" });
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const nombreArchivo = `Ficha_Inspeccion_${timestamp}.docx`;
            const rutaCompleta = path.join(this.rutaSalida, nombreArchivo);
            
            fs.writeFileSync(rutaCompleta, buf);
            
            return {
                exito: true,
                mensaje: "Ficha de inspección generada exitosamente",
                archivo: nombreArchivo,
                ruta: rutaCompleta
            };
        } catch (error) {
            console.error("Error al generar ficha de inspección:", error);
            return {
                exito: false,
                mensaje: `Error al generar la ficha: ${error.message}`,
                error: error
            };
        }
    }

    generarDocumentoTramite(datos) {
        const doc = new PDFDocument();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const nombreArchivo = `Documento_Tramite_${timestamp}.pdf`;
        const rutaCompleta = path.join(this.rutaSalida, nombreArchivo);
        
        doc.pipe(fs.createWriteStream(rutaCompleta));
        doc.fontSize(25).text('Documento de Trámite', { align: 'center' });
        doc.text(`Nombre del Contribuyente: ${datos.NOMBRE_CONTRIBUYENTE}`);
        doc.text(`Dirección: ${datos.DIRECCION}`);
        doc.text(`Ubicación del Lote: ${datos.UBICACION_LOTE}`);
        doc.text(`Medida: ${datos.MEDIDA_TRAMITE}`);
        // Agrega más datos según sea necesario
        doc.end();
        return {
            exito: true,
            mensaje: "Documento de trámite generado exitosamente",
            archivo: nombreArchivo,
            ruta: rutaCompleta
        };
    }

    listarDocumentosGenerados() {
        try {
            const archivos = fs.readdirSync(this.rutaSalida);
            return archivos.filter(archivo => archivo.endsWith('.docx'));
        } catch (error) {
            console.error("Error al listar documentos:", error);
            return [];
        }
    }
    limpiarDocumentosAntiguos(diasAntiguedad = 30) {
        try {
            const archivos = fs.readdirSync(this.rutaSalida);
            const fechaLimite = new Date();
            fechaLimite.setDate(fechaLimite.getDate() - diasAntiguedad);
            archivos.forEach(archivo => {
                const rutaArchivo = path.join(this.rutaSalida, archivo);
                const stats = fs.statSync(rutaArchivo);
                
                if (stats.mtime < fechaLimite) {
                    fs.unlinkSync(rutaArchivo);
                    console.log(`Documento eliminado: ${archivo}`);
                }
            });
        } catch (error) {
            console.error("Error al limpiar documentos antiguos:", error);
        }
    }
}
module.exports = GeneradorDocumentos;