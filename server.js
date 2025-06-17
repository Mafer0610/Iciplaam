const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "iciplam"
})
.then(() => console.log('Conectado a MongoDB - BD: iciplam'))
.catch(err => console.error('Error de conexión:', err));

const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

const Lapida = require('./models/lapida');

app.get('/lapidas', async (req, res) => {
    const filtro = req.query.nombre?.toLowerCase() || "";

    try {
        const resultados = await Lapida.find({
            $or: [
                { NOM_REG: { $regex: filtro, $options: "i" } },
                { NOMBRE_PROPIE: { $regex: filtro, $options: "i" } }
            ]
        }).limit(50);

        res.json(resultados);
    } catch (error) {
        console.error("Error en la búsqueda:", error);
        res.status(500).send("Error en la base de datos.");
    }
});

app.post('/lapidas', async (req, res) => {
    try {
        const nuevaLapida = new Lapida(req.body);
        await nuevaLapida.save();
        res.json({ mensaje: "✅ Lápida agregada correctamente" });
    } catch (err) {
        res.status(500).json({ error: "❌ Error al agregar la lápida" });
    }
});

app.put('/lapidas/:id', async (req, res) => {
    try {
        const lapidaActualizada = await Lapida.findOneAndUpdate(
            { NOM_REG: req.params.id },
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


app.delete('/lapidas/:id', async (req, res) => {
    try {
        await Lapida.findByIdAndDelete(req.params.id);
        res.json({ mensaje: "✅ Lápida eliminada correctamente" });
    } catch (err) {
        res.status(500).json({ error: "❌ Error al eliminar la lápida" });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.listen(5000, () => console.log('🚀 Servidor en ejecución: http://localhost:5000'));