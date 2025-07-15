document.addEventListener("DOMContentLoaded", async function () {
    const params = new URLSearchParams(window.location.search);
    const registroId = params.get("NOM_REG");
    
    if (!registroId) {
        console.warn("No se proporcionó un NOM_REG en la URL.");
        document.querySelector(".detalle-lapida").innerHTML = "<tr><td colspan='2'>No se proporcionó ID de registro.</td></tr>";
        return;
    }
    
    // Guardar el NOM_REG globalmente para el historial
    currentNomReg = registroId;
    
    try {
        const response = await fetchAutenticado(`http://localhost:5000/lapidas/${registroId}`);
        if (!response.ok) throw new Error("Error al obtener datos");
        const lapida = await response.json();

        // Llenar la información actual
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
        document.getElementById("X").textContent = lapida.X || "Sin coordenadas";
        document.getElementById("Y").textContent = lapida.Y || "Sin coordenadas";
        document.getElementById("CVE_POB").textContent = lapida.CVE_POB || "Sin clave";
        document.getElementById("CVE_PANTEO").textContent = lapida.CVE_PANTEO || "Sin clave";
        document.getElementById("CVE_ZONA").textContent = lapida.CVE_ZONA || "Sin clave";
        document.getElementById("CVE_LOTE").textContent = lapida.CVE_LOTE || "Sin clave";
        document.getElementById("CUENTA").textContent = lapida.CUENTA || "Sin cuenta";

        // Manejo de la imagen
        if (lapida.RUTA && lapida.RUTA !== "Sin imagen") {
            const nombreArchivo = lapida.RUTA.replace(/^.*[\\/]/, "");
            const rutaElement = document.getElementById("RUTA");
            rutaElement.innerHTML = `
                <div>
                    <div style="margin-top: 5px;">
                        <div style="width: 100%; background-color: #f0f0f0; border-radius: 3px; height: 6px;">
                            <div id="loading-bar" style="width: 0%; background-color: #2E7FCF; height: 100%; border-radius: 3px; transition: width 0.3s;"></div>
                        </div>
                    </div>
                </div>
            `;

            const loadingBar = document.getElementById('loading-bar');
            setTimeout(() => loadingBar.style.width = '50%', 100);

            fetch(`http://localhost:5000/api/imagen-url/${nombreArchivo}`)
                .then(response => response.json())
                .then(data => {
                    loadingBar.style.width = '100%';
                    
                    setTimeout(() => {
                        if (data.exists) {
                            rutaElement.innerHTML = `
                                <div style="display: flex; flex-direction: column; gap: 10px;">
                                    <div style="display: flex; gap: 10px; align-items: center;">
                                        <a href="${data.viewUrl}" target="_blank" 
                                        style="background: #2E7FCF; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-size: 14px;">
                                            Ver en Google Drive
                                        </a>
                                        <span style="color: #28a745; font-size: 14px;">Disponible</span>
                                    </div>
                                    <div style="border: 1px solid #ddd; border-radius: 4px; overflow: hidden; max-width: 300px;">
                                        <img src="${data.directUrl}" 
                                            alt="Vista previa - ${nombreArchivo}" 
                                            style="width: 100%; height: auto; max-height: 200px; object-fit: cover; display: block; opacity: 0; transition: opacity 0.3s;" 
                                            onload="this.style.opacity='1'"
                                        onerror="this.style.display='none'"
                                    </div>
                                </div>
                            `;
                        } else {
                            rutaElement.innerHTML = `
                                <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px;">
                                    <span style="color: #856404;">⚠️</span>
                                    <div>
                                        <div style="font-weight: bold; color: #856404;">Imagen no encontrada</div>
                                        <div style="font-size: 12px; color: #856404;">Archivo: ${nombreArchivo}</div>
                                    </div>
                                </div>
                            `;
                        }
                    }, 500);
                })
                .catch(error => {
                    console.error('Error al verificar imagen:', error);
                    loadingBar.style.width = '100%';
                    loadingBar.style.backgroundColor = '#dc3545';
                    
                    setTimeout(() => {
                        rutaElement.innerHTML = `
                            <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px;">
                                <span style="color: #721c24;">❌</span>
                                <div>
                                    <div style="font-weight: bold; color: #721c24;">Error de conexión</div>
                                    <div style="font-size: 12px; color: #721c24;">No se pudo verificar la imagen</div>
                                    <a href="http://localhost:5000/imagenes/${nombreArchivo}" target="_blank" 
                                        style="color: #721c24; text-decoration: underline; font-size: 12px;">
                                        Intentar acceso directo
                                    </a>
                                </div>
                            </div>
                        `;
                    }, 500);
                });
        } else {
            document.getElementById("RUTA").innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: #e9ecef; border: 1px solid #ced4da; border-radius: 4px;">
                    <div>
                        <div style="font-weight: bold; color: #6c757d;">Sin imagen</div>
                        <div style="font-size: 12px; color: #6c757d;">No hay imagen asociada a este registro</div>
                    </div>
                </div>
            `;
        }
        
    } catch (error) {
        console.error("Error al obtener los datos:", error);
        document.querySelector(".detalle-lapida").innerHTML = "<tr><td colspan='2'>No se pudo cargar la información.</td></tr>";
    }
});