const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
require('dotenv').config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/imagenes', express.static('FOTOS_PANTEON_MUNICIPAL'));
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "iciplam"
})
.then(() => console.log('Conectado a MongoDB - BD: iciplam'))
.catch(err => console.error('Error de conexión:', err));

// Ruta para generar documento de trámite
app.post('/generar-tramite', async (req, res) => {
    try {
        console.log('Datos recibidos para trámite:', req.body);
        
        const resultado = generarDocumentoTramite(req.body);
        
        if (resultado.exito) {
            console.log('Documento de trámite generado exitosamente:', resultado.archivo);
            
            // Enviar el archivo para descarga
            res.download(resultado.ruta, resultado.archivo, (err) => {
                if (err) {
                    console.error('Error al enviar archivo:', err);
                    res.status(500).json({ error: 'Error al descargar el archivo' });
                } else {
                    console.log('Archivo enviado exitosamente');
                }
            });
        } else {
            console.error('Error al generar documento de trámite:', resultado.mensaje);
            res.status(500).json({ error: resultado.mensaje });
        }
    } catch (error) {
        console.error('Error en ruta generar-tramite:', error);
res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// Función para generar documento de trámite en PDF
function generarDocumentoTramite(datos) {
    const doc = new PDFDocument();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const nombreArchivo = `Documento_Tramite_${timestamp}.pdf`;
    const rutaCompleta = path.join(__dirname, 'documentos_generados', nombreArchivo);
    
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

const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

const jwt = require('jsonwebtoken');

// Middleware para verificar JWT
function verificarToken(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_clave_secreta');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido' });
    }
}

const Lapida = require('./models/lapida');

// Búsqueda mejorada
app.get('/lapidas', async (req, res) => {
    const filtro = req.query.nombre?.toLowerCase().trim() || "";

    try {
        const limite = parseInt(req.query.limit) || 7;

        let resultados;

        if (filtro) {
            const palabras = filtro.split(/\s+/).filter(palabra => palabra.length > 0);
            
            const condicionesPalabras = palabras.map(palabra => ({
                $or: [
                    { NOM_REG: { $regex: palabra, $options: "i" } },
                    { NOMBRE_PROPIE: { $regex: palabra, $options: "i" } }
                ]
            }));

            resultados = await Lapida.find({
                $and: condicionesPalabras
            }).limit(limite);
        } else {
            resultados = await Lapida.find({}).limit(limite);
        }

        res.json(resultados);
    } catch (error) {
        console.error("Error en la búsqueda:", error);
        res.status(500).send("Error en la base de datos.");
    }
});

// Ver
app.get('/lapidas/:NOM_REG', async (req, res) => {
    try {
        const lapida = await Lapida.findOne({ NOM_REG: req.params.NOM_REG });
        if (!lapida) {
            return res.status(404).json({ error: "Lápida no encontrada" });
        }
        res.json(lapida);
    } catch (err) {
        console.error("Error al buscar lápida:", err);
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// Agregar
app.post('/lapidas', async (req, res) => {
    try {
        const nuevaLapida = new Lapida(req.body);
        await nuevaLapida.save();
        res.json({ mensaje: "Lápida agregada correctamente" });
    } catch (err) {
        res.status(500).json({ error: "Error al agregar la lápida" });
    }
});

// Borrar
app.delete('/lapidas/:id', async (req, res) => {
    try {
        await Lapida.findByIdAndDelete(req.params.id);
        res.json({ mensaje: "Lápida eliminada correctamente" });
    } catch (err) {
        res.status(500).json({ error: "Error al eliminar la lápida" });
    }
});

// Actualizar
app.put('/lapidas/:NOM_REG', async (req, res) => {
    try {
        const lapidaActualizada = await Lapida.findOneAndUpdate(
            { NOM_REG: req.params.NOM_REG },
            req.body,
            { new: true } 
        );

        if (!lapidaActualizada) {
            return res.status(404).json({ error: "Lápida no encontrada" });
        }

        res.json({ mensaje: "Lápida actualizada correctamente", lapidaActualizada });
    } catch (err) {
        console.error("Error al actualizar la lápida:", err);
        res.status(500).json({ error: "Error al actualizar la lápida" });
    }
});

// Conteo de datos
app.get('/lapidas/count/total', async (req, res) => {
    try {
        const total = await Lapida.countDocuments();
        res.json({ total });
    } catch (error) {
        console.error("Error al obtener el conteo:", error);
        res.status(500).json({ error: "Error al obtener el conteo de registros" });
    }
});

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.listen(5000, () => console.log('Servidor en ejecución: http://localhost:5000'));