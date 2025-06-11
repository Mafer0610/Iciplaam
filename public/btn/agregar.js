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
        LOTES_A: document.getElementById('LOTES_A').value,
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

    try {
        const response = await fetch('http://localhost:5000/lapidas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.message) {
            alert(data.message);
            document.getElementById('register-form').style.display = 'none';
            cargarTabla();
        } else {
            alert("Error al agregar el registro, intenta de nuevo.");
        }
    } catch (error) {
        console.error("Error en la solicitud:", error);
        alert("Hubo un problema al agregar el registro. Inténtalo más tarde.");
    }
});