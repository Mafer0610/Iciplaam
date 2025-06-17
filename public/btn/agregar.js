document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        NOM_REG: document.getElementById('NOM_REG').value,
        NOMBRE_PROPIE: document.getElementById('NOMBRE_PROPIE').value,
        DIRECCION: document.getElementById('DIRECCION').value,
        UBICACION: document.getElementById('UBICACION').value,
        LOTE: document.getElementById('LOTE').value,
        MEDIDAS_NO: document.getElementById('MEDIDAS_NO').value,
        EDO_CONTRI: document.getElementById('EDO_CONTRI').value,
        COLONIA: document.getElementById('COLONIA').value,
        MEDIDAS: document.getElementById('MEDIDAS').value,
        LOTE_A: document.getElementById('LOTE_A').value,
        ZONA: document.getElementById('ZONA').value,
        FILA: document.getElementById('FILA').value, 
        RUTA: document.getElementById('RUTA').value,
        X: document.getElementById('X').value,
        Y: document.getElementById('Y').value,
        CVE_POB: document.getElementById('CVE_POB').value,
        CVE_PANTEO: document.getElementById('CVE_PANTEO').value,
        CVE_ZONA: document.getElementById('CVE_ZONA').value,
        CVE_LOTE: document.getElementById('CVE_LOTE').value,
        CUENTA: document.getElementById('CUENTA').value
    };

    console.log("Datos enviados:", formData); // ✅ Verificación en consola

    try {
        const response = await fetch('http://localhost:5000/lapidas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error("Error al agregar el registro, intenta de nuevo.");
        }

        const data = await response.json();
        console.log("Respuesta del servidor:", data);

        alert("Registro agregado correctamente.");
        document.getElementById('register-form').reset();
    } catch (error) {
        console.error("Error en la solicitud:", error);
        alert(error.message);
    }
});
