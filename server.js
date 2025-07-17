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

        const fileMap = {};
        allFiles.forEach(file => {
            fileMap[file.name] = {
                id: file.id,
                webViewLink: file.webViewLink,
                webContentLink: file.webContentLink
            };
        });

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
const Tramite = require('./models/tramite');
const Ficha = require('./models/ficha');
const Control = require('./models/control');

// MODELO DE HISTORIAL CON NOMBRE DE COLECCIÓN ESPECÍFICO
const HistorialSchema = new mongoose.Schema({
    NOM_REG: {
        type: String,
        required: true,
        index: true
    },
    fecha_cambio: {
        type: Date,
        default: Date.now
    },
    usuario: {
        type: String,
        default: "Sistema"
    },
    tipo_operacion: {
        type: String,
        enum: ['CREACION', 'MODIFICACION'],
        default: 'MODIFICACION'
    },
    datos_anteriores: {
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
    },
    datos_nuevos: {
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
    },
    campos_modificados: [{
        campo: String,
        valor_anterior: String,
        valor_nuevo: String
    }]
});

// FORZAR EL NOMBRE EXACTO DE LA COLECCIÓN
const Historial = mongoose.model("Historial", HistorialSchema, "historial");

// FUNCIÓN PARA GUARDAR EN HISTORIAL
async function guardarHistorial(nomReg, datosAnteriores, datosNuevos, tipoOperacion = 'MODIFICACION') {
    try {
        console.log(`📝 Guardando historial para ${nomReg}`);
        
        const camposModificados = [];
        
        // Campos a comparar
        const campos = [
            'NOMBRE_PROPIE', 'DIRECCION', 'UBICACION', 'LOTE', 'MEDIDAS_NO', 
            'EDO_CONTRI', 'COLONIA', 'MEDIDAS', 'LOTES_A', 'ZONA', 'FILA', 
            'RUTA', 'X', 'Y', 'CVE_POB', 'CVE_PANTEO', 'CVE_ZONA', 'CVE_LOTE', 'CUENTA'
        ];

        // Comparar campos y registrar cambios
        campos.forEach(campo => {
            const valorAnterior = datosAnteriores[campo] || '';
            const valorNuevo = datosNuevos[campo] || '';
            
            if (valorAnterior !== valorNuevo) {
                camposModificados.push({
                    campo: campo,
                    valor_anterior: valorAnterior,
                    valor_nuevo: valorNuevo
                });
            }
        });

        // Solo guardar si hay cambios (excepto para CREACION)
        if (tipoOperacion === 'CREACION' || camposModificados.length > 0) {
            const historial = new Historial({
                NOM_REG: nomReg,
                tipo_operacion: tipoOperacion,
                datos_anteriores: datosAnteriores,
                datos_nuevos: datosNuevos,
                campos_modificados: camposModificados
            });

            const resultado = await historial.save();
            console.log(`✅ Historial guardado exitosamente - ID: ${resultado._id}`);
            console.log(`📊 Cambios registrados: ${camposModificados.length}`);
        }
    } catch (error) {
        console.error('❌ Error al guardar historial:', error);
    }
}

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

// RUTA PARA OBTENER HISTORIAL
app.get('/historial/:NOM_REG', async (req, res) => {
    try {
        console.log(`🔍 Buscando historial para: ${req.params.NOM_REG}`);
        
        const historial = await Historial.find({ NOM_REG: req.params.NOM_REG })
            .sort({ fecha_cambio: -1 })
            .limit(50);
        
        console.log(`📋 Historial encontrado: ${historial.length} entradas`);
        
        res.json(historial);
    } catch (error) {
        console.error('❌ Error al obtener historial:', error);
        res.status(500).json({ error: 'Error al obtener historial' });
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

// Agregar - CON HISTORIAL DE CREACIÓN
app.post('/lapidas', async (req, res) => {
    try {
        console.log('🆕 Creando nueva lápida');
        
        const nuevaLapida = new Lapida(req.body);
        await nuevaLapida.save();
        
        // Guardar en historial como CREACION
        await guardarHistorial(req.body.NOM_REG, {}, req.body, 'CREACION');
        
        console.log(`✅ Lápida ${req.body.NOM_REG} creada exitosamente`);
        res.json({ mensaje: "Lápida agregada correctamente" });
    } catch (err) {
        console.error("Error al agregar lápida:", err);
        res.status(500).json({ error: "Error al agregar la lápida" });
    }
});

// Borrar - SIN HISTORIAL
app.delete('/lapidas/:id', async (req, res) => {
    try {
        await Lapida.findByIdAndDelete(req.params.id);
        res.json({ mensaje: "Lápida eliminada correctamente" });
    } catch (err) {
        res.status(500).json({ error: "Error al eliminar la lápida" });
    }
});

// Actualizar - CON HISTORIAL
app.put('/lapidas/:NOM_REG', async (req, res) => {
    try {
        console.log(`🔄 Actualizando lápida: ${req.params.NOM_REG}`);
        
        // Primero obtener los datos actuales
        const lapidaAnterior = await Lapida.findOne({ NOM_REG: req.params.NOM_REG });
        
        if (!lapidaAnterior) {
            return res.status(404).json({ error: "Lápida no encontrada" });
        }

        // Actualizar la lápida
        const lapidaActualizada = await Lapida.findOneAndUpdate(
            { NOM_REG: req.params.NOM_REG },
            req.body,
            { new: true }
        );

        // Guardar en historial DESPUÉS de la actualización exitosa
        await guardarHistorial(
            req.params.NOM_REG,
            lapidaAnterior.toObject(),
            req.body,
            'MODIFICACION'
        );

        console.log(`✅ Lápida ${req.params.NOM_REG} actualizada exitosamente`);
        res.json({ mensaje: "Lápida actualizada correctamente", lapidaActualizada });
    } catch (err) {
        console.error("❌ Error al actualizar la lápida:", err);
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

// RUTA DE DEBUG
app.get('/debug/historial', async (req, res) => {
    try {
        const totalHistorial = await Historial.countDocuments();
        const ultimosRegistros = await Historial.find().sort({ fecha_cambio: -1 }).limit(5);
        
        res.json({
            collection_name: Historial.collection.collectionName,
            total_registros_historial: totalHistorial,
            ultimos_5_registros: ultimosRegistros
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
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

// Obtener todos los trámites con búsqueda
app.get('/tramites', async (req, res) => {
    try {
        const busqueda = req.query.busqueda?.toLowerCase().trim() || "";
        const limite = parseInt(req.query.limit) || 10;
        
        let resultados;
        
        if (busqueda) {
            const palabras = busqueda.split(/\s+/).filter(palabra => palabra.length > 0);
            
            const condicionesPalabras = palabras.map(palabra => ({
                $or: [
                    { FOLIO: { $regex: palabra, $options: "i" } },
                    { TITULAR: { $regex: palabra, $options: "i" } },
                    { INHUMACION: { $regex: palabra, $options: "i" } },
                    { TRASPASO: { $regex: palabra, $options: "i" } }
                ]
            }));
            
            resultados = await Tramite.find({
                $and: condicionesPalabras
            }).sort({ FECHA_ELA: -1 }).limit(limite);
        } else {
            resultados = await Tramite.find({}).sort({ FECHA_ELA: -1 }).limit(limite);
        }
        
        res.json(resultados);
    } catch (error) {
        console.error("Error al obtener trámites:", error);
        res.status(500).json({ error: "Error en la base de datos" });
    }
});

// Obtener un trámite específico por ID
app.get('/tramites/:id', async (req, res) => {
    try {
        const tramite = await Tramite.findById(req.params.id);
        if (!tramite) {
            return res.status(404).json({ error: "Trámite no encontrado" });
        }
        res.json(tramite);
    } catch (err) {
        console.error("Error al buscar trámite:", err);
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// Crear nuevo trámite
app.post('/tramites', async (req, res) => {
    try {
        console.log('🆕 Creando nuevo trámite');
        
        const nuevoTramite = new Tramite(req.body);
        await nuevoTramite.save();
        
        console.log(`✅ Trámite ${req.body.FOLIO} creado exitosamente`);
        res.json({ mensaje: "Trámite agregado correctamente", id: nuevoTramite._id });
    } catch (err) {
        console.error("Error al agregar trámite:", err);
        if (err.code === 11000) {
            res.status(400).json({ error: "El folio ya existe" });
        } else {
            res.status(500).json({ error: "Error al agregar el trámite" });
        }
    }
});

// Actualizar trámite
app.put('/tramites/:id', async (req, res) => {
    try {
        console.log(`🔄 Actualizando trámite: ${req.params.id}`);
        
        const tramiteActualizado = await Tramite.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        
        if (!tramiteActualizado) {
            return res.status(404).json({ error: "Trámite no encontrado" });
        }
        
        console.log(`✅ Trámite ${req.params.id} actualizado exitosamente`);
        res.json({ mensaje: "Trámite actualizado correctamente", tramiteActualizado });
    } catch (err) {
        console.error("❌ Error al actualizar trámite:", err);
        res.status(500).json({ error: "Error al actualizar el trámite" });
    }
});

// Eliminar trámite
app.delete('/tramites/:id', async (req, res) => {
    try {
        const tramiteEliminado = await Tramite.findByIdAndDelete(req.params.id);
        if (!tramiteEliminado) {
            return res.status(404).json({ error: "Trámite no encontrado" });
        }
        res.json({ mensaje: "Trámite eliminado correctamente" });
    } catch (err) {
        console.error("Error al eliminar trámite:", err);
        res.status(500).json({ error: "Error al eliminar el trámite" });
    }
});

// Conteo total de trámites
app.get('/tramites/count/total', async (req, res) => {
    try {
        const total = await Tramite.countDocuments();
        res.json({ total });
    } catch (error) {
        console.error("Error al obtener el conteo de trámites:", error);
        res.status(500).json({ error: "Error al obtener el conteo de trámites" });
    }
});

// Generar y descargar Excel con trámites del año especificado usando plantilla
app.get('/tramites/excel/:year', async (req, res) => {
    try {
        const year = parseInt(req.params.year);
        console.log(`📊 Generando Excel para trámites del año ${year} usando plantilla`);
        
        // Ruta corregida de la plantilla
        const rutaPlantilla = path.join(__dirname, 'Docs', 'RelacionTramites.xlsx');
        console.log(`📂 Buscando plantilla en: ${rutaPlantilla}`);
        
        if (!fs.existsSync(rutaPlantilla)) {
            console.error('❌ Plantilla Excel no encontrada:', rutaPlantilla);
            // Intentar ruta alternativa
            const rutaAlternativa = path.join(__dirname, 'RelacionTramites.xlsx');
            console.log(`📂 Intentando ruta alternativa: ${rutaAlternativa}`);
            
            if (!fs.existsSync(rutaAlternativa)) {
                console.error('❌ Plantilla no encontrada en ninguna ubicación');
                return res.status(500).json({ 
                    error: 'Plantilla Excel no encontrada',
                    rutaBuscada: rutaPlantilla,
                    rutaAlternativa: rutaAlternativa
                });
            } else {
                // Usar ruta alternativa
                rutaPlantilla = rutaAlternativa;
            }
        }

        // Leer la plantilla
        const XLSX = require('xlsx');
        console.log('📖 Leyendo plantilla Excel...');
        const templateBuffer = fs.readFileSync(rutaPlantilla);
        const workbook = XLSX.read(templateBuffer, {
            cellStyles: true,
            cellFormulas: true,
            cellDates: true,
            cellNF: true,
            sheetStubs: true
        });

        console.log('📋 Hojas disponibles:', workbook.SheetNames);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Obtener trámites del año especificado
        const inicioAño = new Date(year, 0, 1);
        const finAño = new Date(year + 1, 0, 1);
        
        console.log(`🔍 Buscando trámites entre ${inicioAño.toISOString()} y ${finAño.toISOString()}`);
        
        const tramites = await Tramite.find({
            FECHA_ELA: {
                $gte: inicioAño,
                $lt: finAño
            }
        }).sort({ FECHA_ELA: 1 });
        
        console.log(`📋 Encontrados ${tramites.length} trámites para el año ${year}`);
        
        // Actualizar el placeholder del año en la celda A3
        console.log('🔄 Actualizando año en plantilla...');
        const cellA3 = worksheet['A3'];
        if (cellA3 && cellA3.v) {
            const textoOriginal = cellA3.v;
            console.log(`📝 Texto original A3: "${textoOriginal}"`);
            cellA3.v = textoOriginal.replace('{FECHA_ACTU}', year.toString());
            console.log(`📝 Texto actualizado A3: "${cellA3.v}"`);
        } else {
            console.log('⚠️ Celda A3 no encontrada, creando nueva...');
            worksheet['A3'] = {
                v: `RELACION DE TRAMITES CORRESPONDIENTE AL EJERCICIO ${year} PANTEONES PUBLICOS MUNICIPALES`,
                t: 's'
            };
        }

        // Limpiar datos existentes (mantener solo las primeras 5 filas de encabezados)
        console.log('🧹 Limpiando datos existentes...');
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        console.log(`📏 Rango actual: ${worksheet['!ref']}`);
        
        for (let row = 5; row <= range.e.r; row++) {
            for (let col = 0; col <= range.e.c; col++) {
                const cellRef = XLSX.utils.encode_cell({r: row, c: col});
                delete worksheet[cellRef];
            }
        }

        // Agregar datos de trámites comenzando desde la fila 6 (índice 5)
        console.log('📝 Agregando datos de trámites...');
        tramites.forEach((tramite, index) => {
            const rowIndex = 5 + index; // Comenzar en fila 6 (índice 5)
            
            const rowData = [
                tramite.FECHA_ELA ? tramite.FECHA_ELA.toLocaleDateString('es-MX') : '', // A
                tramite.FOLIO || '',                                                    // B
                tramite.TITULAR || '',                                                  // C
                tramite.INHUMACION || '',                                               // D
                tramite.TRASPASO || '',                                                 // E
                tramite.RECIBO || '',                                                   // F
                tramite.COSTO_INHU || '',                                               // G
                tramite.COSTO_EXHU || '',                                               // H
                tramite.REPOSICION || '',                                               // I
                tramite.COSTO_TRASPASO || '',                                           // J
                tramite.LOTE || '',                                                     // K
                tramite.COSTO_MANTENIMIENTO || '',                                      // L
                tramite.AMPL_CM || '',                                                  // M
                tramite.COSTO_REGULARIZACION || '',                                     // N
                tramite.COSTO_CONSTRUCCION || '',                                       // O
                tramite.COSTO_BUSQUEDA || ''                                            // P
            ];

            // Agregar cada celda con el estilo apropiado
            rowData.forEach((value, colIndex) => {
                const cellRef = XLSX.utils.encode_cell({r: rowIndex, c: colIndex});
                worksheet[cellRef] = {
                    v: value,
                    t: 's', // tipo string
                    s: {
                        patternType: 'none',
                        alignment: { 
                            horizontal: 'left', 
                            vertical: 'center' 
                        },
                        border: {
                            top: { style: 'thin', color: { auto: 1 } },
                            bottom: { style: 'thin', color: { auto: 1 } },
                            left: { style: 'thin', color: { auto: 1 } },
                            right: { style: 'thin', color: { auto: 1 } }
                        }
                    }
                };
            });

            if (index % 100 === 0) {
                console.log(`📊 Procesados ${index + 1} de ${tramites.length} trámites...`);
            }
        });

        // Actualizar el rango de la hoja
        const newRange = {
            s: { c: 0, r: 0 },
            e: { c: 15, r: Math.max(5, 5 + tramites.length - 1) }
        };
        worksheet['!ref'] = XLSX.utils.encode_range(newRange);
        console.log(`📏 Nuevo rango: ${worksheet['!ref']}`);

        // Asegurar que las celdas combinadas estén configuradas para los encabezados
        console.log('🔗 Configurando celdas combinadas...');
        if (!worksheet['!merges']) {
            worksheet['!merges'] = [];
        }
        
        // Limpiar merges existentes y agregar los correctos
        worksheet['!merges'] = [
            {s: {c: 0, r: 0}, e: {c: 15, r: 0}}, // SECRETARIA DE SERVICIOS MUNICIPALES
            {s: {c: 0, r: 1}, e: {c: 15, r: 1}}, // DIRECCION DE PANTEONES
            {s: {c: 0, r: 2}, e: {c: 15, r: 2}}  // RELACION DE TRAMITES...
        ];

        // Aplicar estilos a los encabezados principales (centrado y negrita)
        console.log('🎨 Aplicando estilos a encabezados...');
        ['A1', 'A2', 'A3'].forEach((cellRef, index) => {
            if (!worksheet[cellRef]) {
                // Crear la celda si no existe
                const textos = [
                    'SECRETARIA DE SERVICIOS MUNICIPALES',
                    'DIRECCION DE PANTEONES',
                    `RELACION DE TRAMITES CORRESPONDIENTE AL EJERCICIO ${year} PANTEONES PUBLICOS MUNICIPALES`
                ];
                worksheet[cellRef] = {
                    v: textos[index],
                    t: 's'
                };
            }
            
            worksheet[cellRef].s = {
                alignment: { 
                    horizontal: 'center', 
                    vertical: 'center',
                    wrapText: true
                },
                font: { 
                    bold: true,
                    size: cellRef === 'A3' ? 12 : 14,
                    name: 'Calibri'
                },
                patternType: 'none'
            };
            console.log(`✅ Estilo aplicado a ${cellRef}: "${worksheet[cellRef].v}"`);
        });

        // Aplicar estilos a los encabezados de columnas (fila 5)
        console.log('🎨 Aplicando estilos a encabezados de columnas...');
        for (let col = 0; col < 16; col++) {
            const cellRef = XLSX.utils.encode_cell({r: 4, c: col});
            if (worksheet[cellRef]) {
                worksheet[cellRef].s = {
                    alignment: { 
                        horizontal: 'center', 
                        vertical: 'center',
                        wrapText: true
                    },
                    font: { 
                        bold: true,
                        size: 10,
                        name: 'Calibri'
                    },
                    patternType: 'solid',
                    fgColor: { theme: 0, tint: -0.1499984740745262 },
                    bgColor: { indexed: 64 },
                    border: {
                        top: { style: 'thin', color: { auto: 1 } },
                        bottom: { style: 'thin', color: { auto: 1 } },
                        left: { style: 'thin', color: { auto: 1 } },
                        right: { style: 'thin', color: { auto: 1 } }
                    }
                };
            }
        }

        // Configurar anchos de columnas
        console.log('📐 Configurando anchos de columnas...');
        worksheet['!cols'] = [
            { wch: 15 }, // FECHA DE ELABORACION
            { wch: 10 }, // FOLIOS
            { wch: 25 }, // NOMBRE DEL TITULAR
            { wch: 20 }, // INHUMACION DE
            { wch: 25 }, // NOMBRE TITULAR SALIENTE
            { wch: 15 }, // RECIBO OFICIAL
            { wch: 15 }, // COSTO DE INHUMACION
            { wch: 15 }, // COSTO DE LA EXHUMACIÓN
            { wch: 15 }, // REPOSICIÓN CONSTANCIA
            { wch: 15 }, // COSTO DEL TRASPASO
            { wch: 10 }, // LOTE
            { wch: 15 }, // MANTENIMIENTO
            { wch: 15 }, // AMPL CM LINEAL
            { wch: 20 }, // REGULARIZACION LOTES
            { wch: 15 }, // CONSTRUCCION
            { wch: 20 }  // BUSQUEDAD DE INFORMACION
        ];

        // Configurar alturas de filas para los encabezados
        if (!worksheet['!rows']) {
            worksheet['!rows'] = [];
        }
        worksheet['!rows'][0] = { hpt: 25 }; // Fila 1
        worksheet['!rows'][1] = { hpt: 25 }; // Fila 2
        worksheet['!rows'][2] = { hpt: 30 }; // Fila 3
        worksheet['!rows'][4] = { hpt: 40 }; // Fila 5 (encabezados de columnas)

        // Generar buffer del archivo
        console.log('💾 Generando archivo Excel...');
        const buffer = XLSX.write(workbook, { 
            type: 'buffer', 
            bookType: 'xlsx',
            cellStyles: true
        });
        
        // Configurar headers para descarga
        const nombreArchivo = `Relacion_Tramites_${year}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
        res.setHeader('Content-Length', buffer.length);
        
        // Enviar archivo
        res.send(buffer);
        
        console.log(`✅ Excel "${nombreArchivo}" generado exitosamente para ${tramites.length} trámites del año ${year}`);
        
    } catch (error) {
        console.error('❌ Error detallado al generar Excel:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ 
            error: 'Error al generar el archivo Excel',
            detalle: error.message,
            stack: error.stack
        });
    }
});

app.get('/fichas', async (req, res) => {
  try {
    const fichas = await Ficha.find();
    res.json(fichas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener fichas' });
  }
});

app.delete('/fichas/:id', async (req, res) => {
  try {
    await Ficha.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Ficha eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la ficha' });
  }
});


app.listen(5000, () => console.log('Servidor en ejecución: http://localhost:5000'));