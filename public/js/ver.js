document.addEventListener("DOMContentLoaded", async function () {
    const params = new URLSearchParams(window.location.search);
    const registroId = params.get("NOM_REG");
    if (!registroId) {
        console.warn("No se proporcionó un NOM_REG en la URL.");
        document.querySelector(".detalle-lapida").innerHTML = "<tr><td colspan='2'>No se proporcionó ID de registro.</td></tr>";
        return;
    }
    try {
        const response = await fetchAutenticado(`http://localhost:5000/lapidas/${registroId}`);
        if (!response.ok) throw new Error("Error al obtener datos");
        const lapida = await response.json();

        document.getElementById("NOM_REG").textContent = lapida.NOM_REG || "Sin registro";
        document.getElementById("NOMBRE_PROPIE").textContent = lapida.NOMBRE_PROPIE || "Desconocido";
        document.getElementById("DIRECCION").textContent = lapida.DIRECCION || "No registrada"; 
        document.getElementById("UBICACION").textContent = lapida.UBICACION || "No especificada";
        document.getElementById("LOTE").textContent = lapida.LOTE || "No asignado";
        document.getElementById("MEDIDAS_NO").textContent = lapida.MEDIDAS_NO || "No registradas";
        document.getElementById("EDO_CONTRI").textContent = lapida.EDO_CONTRI || "No definido";
        document.getElementById("COLONIA").textContent = lapida.COLONIA || "No registrada";
        document.getElementById("MEDIDAS").textContent = lapida.MEDIDAS || "No registradas";
        document.getElementById("LOTES_A").textContent = lapida.LOTES_A || "No asignado";
        document.getElementById("ZONA").textContent = lapida.ZONA || "Sin zona";
        document.getElementById("FILA").textContent = lapida.FILA || "Sin fila";
        document.getElementById("RUTA").textContent = lapida.RUTA || "Sin imagen";
        document.getElementById("X").textContent = lapida.X || "Sin coordenadas";
        document.getElementById("Y").textContent = lapida.Y || "Sin coordenadas";
        document.getElementById("CVE_POB").textContent = lapida.CVE_POB || "Sin clave";
        document.getElementById("CVE_PANTEO").textContent = lapida.CVE_PANTEO || "Sin clave";
        document.getElementById("CVE_ZONA").textContent = lapida.CVE_ZONA || "Sin clave";
        document.getElementById("CVE_LOTE").textContent = lapida.CVE_LOTE || "Sin clave";
        document.getElementById("CUENTA").textContent = lapida.CUENTA || "Sin cuenta";

        if (lapida.RUTA && lapida.RUTA !== "Sin imagen") {
        const nombreArchivo = lapida.RUTA.replace(/^.*[\\/]/, "");
        const rutaWeb = `http://localhost:5000/imagenes/${nombreArchivo}`;
        const rutaElement = document.getElementById("RUTA");

        rutaElement.innerHTML = `<a href="${rutaWeb}" target="_blank">Ver imagen</a>`;
        }
        
    } catch (error) {
        console.error("Error al obtener los datos:", error);
        document.querySelector(".detalle-lapida").innerHTML = "<tr><td colspan='2'>No se pudo cargar la información.</td></tr>";
    }
});