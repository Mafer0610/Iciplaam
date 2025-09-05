function mostrarMensaje(texto) {
  const mensaje = document.getElementById("mensaje-flotante");
  mensaje.textContent = texto;
  mensaje.classList.add("visible");
  setTimeout(() => mensaje.classList.remove("visible"), 3000);
}

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

  console.log("Datos enviados:", formData);

  try {
    const response = await fetchAutenticado('http://localhost:5000/lapidas', {
      method: 'POST',
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      throw new Error("Error al agregar el registro, intenta de nuevo.");
    }

    const data = await response.json();
    console.log("Respuesta del servidor:", data);

    mostrarMensaje("Registro agregado correctamente.");
    document.getElementById('register-form').reset();

    setTimeout(() => {
      window.location.href = "../panelRegistros.html";
    }, 1000);

  } catch (error) {
    console.error("Error en la solicitud:", error);
    mostrarMensaje(error.message);
  }
});
