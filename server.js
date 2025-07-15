const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
require('dotenv').config();

// NUEVAS DEPENDENCIAS PARA GOOGLE DRIVE
const { google } = require('googleapis');
const NodeCache = require('node-cache');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// CONFIGURACIÓN DE GOOGLE DRIVE API
const driveCache = new NodeCache({ stdTTL: 3600 }); // Cache por 1 hora

const drive = google.drive({
    version: 'v3',
    auth: process.env.GOOGLE_DRIVE_API_KEY
});

const FOLDER_ID = '1R7G6TMC9AHszD5Hg95DAqjxXE9giIJVs';

// Función para cargar todos los archivos de Google Drive
async function cargarArchivosDelDrive() {
    try {
        console.log('🔄 Cargando archivos de Google Drive...');
        let allFiles = [];
        let pageToken = null;
        let totalCargados = 0;

        do {
            const response = await drive.files.list({
                q: `'${FOLDER_ID}' in parents and mimeType contains 'image/'`,
                fields: 'nextPageToken, files(id, name, webViewLink, webContentLink)',
                pageSize: 1000,
                pageToken: pageToken
            });

            allFiles = allFiles.concat(response.data.files);
            pageToken = response.data.nextPageToken;
            totalCargados = allFiles.length;
            
            console.log(`📥 Cargados ${totalCargados} archivos hasta ahora...`);
        } while (pageToken);

        // Crear mapeo nombre -> datos del archivo
        const fileMap = {};
        allFiles.forEach(file => {
            fileMap[file.name] = {
                id: file.id,
                webViewLink: file.webViewLink,
                webContentLink: file.webContentLink
            };
        });

        // Guardar en cache
        driveCache.set('file_map', fileMap);
        console.log(`✅ Total de archivos cargados: ${totalCargados}`);
        
        return fileMap;
    } catch (error) {
        console.error('❌ Error al cargar archivos de Drive:', error.message);
        return {};
    }
}

// Crear directorio para documentos generados
const dirDocumentos = path.join(__dirname, 'documentos_generados');
if (!fs.existsSync(dirDocumentos)) {
    fs.mkdirSync(dirDocumentos, { recursive: true });
}

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "iciplam"
})
.then(() => console.log('Conectado a MongoDB - BD: iciplam'))
.catch(err => console.error('Error de conexión:', err));

// Modelos
const Lapida = require('./models/lapida');
const Ficha = require('./models/ficha');
const Control = require('./models/control');

// NUEVAS RUTAS PARA GOOGLE DRIVE
// Ruta para servir imágenes desde Drive
app.get('/imagenes/:nombreArchivo', async (req, res) => {
    try {
        const nombreArchivo = req.params.nombreArchivo;
        
        // Obtener mapeo del cache
        let fileMap = driveCache.get('file_map');
        
        // Si no hay cache, cargar archivos
        if (!fileMap) {
            console.log('🔄 Cache vacío, cargando archivos...');
            fileMap = await cargarArchivosDelDrive();
        }

        // Buscar el archivo
        const archivo = fileMap[nombreArchivo];
        
        if (archivo) {
            // Redireccionar a la URL directa de Google Drive
            const directUrl = `https://drive.google.com/uc?export=view&id=${archivo.id}`;
            res.redirect(directUrl);
        } else {
            console.log(`❌ Archivo no encontrado: ${nombreArchivo}`);
            res.status(404).json({ error: 'Imagen no encontrada' });
        }
        
    } catch (error) {
        console.error('❌ Error al obtener imagen:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Ruta para obtener información de la imagen
app.get('/api/imagen-url/:nombreArchivo', async (req, res) => {
    try {
        const nombreArchivo = req.params.nombreArchivo;
        
        let fileMap = driveCache.get('file_map');
        if (!fileMap) {
            fileMap = await cargarArchivosDelDrive();
        }

        const archivo = fileMap[nombreArchivo];
        
        if (archivo) {
            res.json({
                exists: true,
                directUrl: `https://drive.google.com/uc?export=view&id=${archivo.id}`,
                viewUrl: archivo.webViewLink,
                downloadUrl: archivo.webContentLink
            });
        } else {
            res.json({
                exists: false,
                message: 'Archivo no encontrado'
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Ruta para monitorear el estado del cache
app.get('/api/cache-status', (req, res) => {
    const fileMap = driveCache.get('file_map');
    res.json({
        cached: !!fileMap,
        fileCount: fileMap ? Object.keys(fileMap).length : 0,
        lastUpdate: driveCache.getTtl('file_map') ? new Date(driveCache.getTtl('file_map')).toISOString() : null
    });
});

// Ruta para guardar ficha de inspección
app.post('/fichas', async (req, res) => {
    console.log('=== DATOS RECIBIDOS EN /fichas ===');
    console.log('Body completo:', JSON.stringify(req.body, null, 2));
    
    try {
        // Procesar conceptos como array si viene como string
        if (req.body.CONCEP) {
            if (typeof req.body.CONCEP === 'string') {
                req.body.CONCEPTOS = req.body.CONCEP.split(', ');
            } else if (Array.isArray(req.body.CONCEP)) {
                req.body.CONCEPTOS = req.body.CONCEP;
            }
            delete req.body.CONCEP;
        }

        // Procesar rectificaciones
        if (req.body.FICHA_RECT_TIPO && !Array.isArray(req.body.FICHA_RECT_TIPO)) {
            req.body.FICHA_RECT_TIPO = [req.body.FICHA_RECT_TIPO];
        }

        const nuevaFicha = new Ficha(req.body);
        const resultado = await nuevaFicha.save();
        console.log('Ficha guardada exitosamente:', resultado._id);
        res.json({ mensaje: "Ficha guardada correctamente", id: resultado._id });
    } catch (err) {
        console.error("Error al guardar ficha:", err);
        res.status(500).json({ error: "Error al guardar la ficha", detalle: err.message });
    }
});

// Ruta para guardar documento de control
app.post('/control', async (req, res) => {
    console.log('=== DATOS RECIBIDOS EN /control ===');
    console.log('Body completo:', JSON.stringify(req.body, null, 2));
    console.log('TIPO_TRAMITE:', req.body.TIPO_TRAMITE);
    console.log('================================');
    
    try {
        // Procesar documentos entregados
        const documentosEntregados = [];
        const documentosIds = [
            'BOLETA_PROPIEDAD', 'PAGO_MANTENIMIENTO', 'INE_PROPIETARIO',
            'PARIENTE', 'TESTIGOS', 'NVO_PROPIETARIO', 'ACTA_DEFUNCION',
            'INHUMADO', 'PROPIETARIO_EXHUMADO', 'ORDEN_INHUMACION',
            'OFICIO_SOLICITUD', 'ACTA_NACIMIENTO', 'ACTA_MATRIMONIO',
            'CARTA_PODER', 'FOTO_LOTE', 'CARTA_RESPONSIVA',
            'CONSTRUCCION_CARTA', 'EXHUMACION_CARTA', 'TRASPASO_CARTA'
        ];

        documentosIds.forEach(id => {
            if (req.body[id] === 'X' || req.body[id] === true) {
                documentosEntregados.push(id);
            }
            delete req.body[id];
        });

        req.body.DOCUMENTOS_ENTREGADOS = documentosEntregados;

        // Asegurar que TIPO_TRAMITE sea un array
        if (req.body.TIPO_TRAMITE && !Array.isArray(req.body.TIPO_TRAMITE)) {
            req.body.TIPO_TRAMITE = [req.body.TIPO_TRAMITE];
        }

        const nuevoControl = new Control(req.body);
        const resultado = await nuevoControl.save();
        console.log('Control guardado exitosamente:', resultado._id);
        res.json({ mensaje: "Control guardado correctamente", id: resultado._id });
    } catch (err) {
        console.error("Error al guardar control:", err);
        res.status(500).json({ error: "Error al guardar el control", detalle: err.message });
    }
});

// Ruta para generar ficha de inspección
app.post('/generar-ficha', async (req, res) => {
    try {
        console.log('Datos recibidos para ficha:', req.body);
        
        const resultado = await generarFichaInspeccion(req.body);
        
        if (resultado.exito) {
            console.log('Ficha de inspección generada exitosamente:', resultado.archivo);
            
            res.download(resultado.ruta, resultado.archivo, (err) => {
                if (err) {
                    console.error('Error al enviar archivo:', err);
                    res.status(500).json({ error: 'Error al descargar el archivo' });
                } else {
                    console.log('Archivo enviado exitosamente');
                    setTimeout(() => {
                        fs.unlink(resultado.ruta, (unlinkErr) => {
                            if (unlinkErr) console.error('Error al eliminar archivo temporal:', unlinkErr);
                        });
                    }, 5000);
                }
            });
        } else {
            console.error('Error al generar ficha:', resultado.mensaje);
            res.status(500).json({ error: resultado.mensaje });
        }
    } catch (error) {
        console.error('Error en ruta generar-ficha:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta para generar documento de trámite
app.post('/generar-tramite', async (req, res) => {
    try {
        console.log('Datos recibidos para trámite:', JSON.stringify(req.body, null, 2));
        
        const resultado = generarDocumentoTramite(req.body);
        
        if (resultado.exito) {
            console.log('Documento de trámite generado exitosamente:', resultado.archivo);
            
            res.download(resultado.ruta, resultado.archivo, (err) => {
                if (err) {
                    console.error('Error al enviar archivo:', err);
                    res.status(500).json({ error: 'Error al descargar el archivo' });
                } else {
                    console.log('Archivo enviado exitosamente');
                    setTimeout(() => {
                        fs.unlink(resultado.ruta, (unlinkErr) => {
                            if (unlinkErr) console.error('Error al eliminar archivo temporal:', unlinkErr);
                        });
                    }, 5000);
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

// Función para generar ficha de inspección usando plantilla Word
async function generarFichaInspeccion(datos) {
    try {
        const rutaPlantilla = path.join(__dirname, 'Docs', 'Fichadeinspeccion_panteon.docx');
        
        if (!fs.existsSync(rutaPlantilla)) {
            console.error('Plantilla no encontrada en:', rutaPlantilla);
            return {
                exito: false,
                mensaje: `Plantilla no encontrada en: ${rutaPlantilla}`
            };
        }

        const content = fs.readFileSync(rutaPlantilla, 'binary');
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        // Formatear fecha si existe
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
        const rutaCompleta = path.join(__dirname, 'documentos_generados', nombreArchivo);
        
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

// Función para generar documento de trámite en word
function generarDocumentoTramite(datos) {
    try {
        const rutaPlantilla = path.join(__dirname, 'Docs', 'FormatoControlTramites.docx');
        
        if (!fs.existsSync(rutaPlantilla)) {
            console.error('Plantilla no encontrada en:', rutaPlantilla);
            return {
                exito: false,
                mensaje: `Plantilla no encontrada en: ${rutaPlantilla}`
            };
        }

        const content = fs.readFileSync(rutaPlantilla, 'binary');
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        console.log('Datos que se enviarán a la plantilla:', JSON.stringify(datos, null, 2));

        doc.setData(datos);
        doc.render();

        const buf = doc.getZip().generate({ type: "nodebuffer" });
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const nombreArchivo = `FormatoControl_${timestamp}.docx`;
        const rutaCompleta = path.join(__dirname, 'documentos_generados', nombreArchivo);
        
        fs.writeFileSync(rutaCompleta, buf);
        
        return {
            exito: true,
            mensaje: "Formato de control generado exitosamente",
            archivo: nombreArchivo,
            ruta: rutaCompleta
        };
    } catch (error) {
        console.error("Error al generar documento de trámite:", error);
        return {
            exito: false,
            mensaje: `Error al generar el documento: ${error.message}`,
            error: error
        };
    }
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

// CARGAR ARCHIVOS AL INICIAR EL SERVIDOR
console.log('Iniciando carga de archivos de Google Drive...');
cargarArchivosDelDrive().then(() => {
    console.log('Carga inicial completada');
}).catch(error => {
    console.error('Error en carga inicial:', error);
});

setInterval(() => {
    console.log('Actualizando cache de Google Drive...');
    cargarArchivosDelDrive();
}, 3600000);

app.listen(5000, () => console.log('Servidor en ejecución: http://localhost:5000'));