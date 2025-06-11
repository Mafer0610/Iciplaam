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
    try {
        const lapidas = await Lapida.find({});
        res.json(lapidas);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener las lápidas" });
    }
});

app.post('/lapidas', async (req, res) => {
    try {
        const nuevaLapida = new Lapida(req.body);
        await nuevaLapida.save();
        res.json({ mensaje: "Lápida agregada correctamente" });
    } catch (err) {
        res.status(500).json({ error: "Error al agregar la lápida" });
    }
});

app.delete('/lapidas/:id', async (req, res) => {
    try {
        await Lapida.findByIdAndDelete(req.params.id);
        res.json({ mensaje: "Lápida eliminada correctamente" });
    } catch (err) {
        res.status(500).json({ error: "Error al eliminar la lápida" });
    }
});
app.get('/lapidas/buscar', async (req, res) => {
    const query = req.query.query;
    try {
        const lapidas = await Lapida.find({ NOMBRE_PROPIE: { $regex: query, $options: "i" } }).limit(50);
        res.json(lapidas);
    } catch (error) {
        res.status(500).json({ message: "Error en la búsqueda", error });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.listen(5000, () => console.log('Abre en tu navegador: http://localhost:5000'));