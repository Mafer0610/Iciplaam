$('.toggle').on('click', function () {
    const $menu = $(this).closest('.menu.adaptado');
    $menu.toggleClass('expanded');
    $(this).toggleClass('close');
});

function cerrarSesion() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "index.html";
}

let idAEliminar = null;
let currentMenuId = null;

document.addEventListener("DOMContentLoaded", () => {
    cargarFormatos();
    cargarContadores();

    document.getElementById("btn-confirmar").addEventListener("click", eliminarConfirmado);
    document.getElementById("btn-cancelar").addEventListener("click", () => {
        document.getElementById("modal-confirmacion").classList.add("oculto");
        idAEliminar = null;
    });
});

async function cargarContadores() {
    try {
        // Cargar contador de formatos
        const resFormatos = await fetch("http://localhost:5000/formatos/count/total");
        const dataFormatos = await resFormatos.json();
        document.getElementById("total-formatos").textContent = dataFormatos.total;
    } catch (err) {
        document.getElementById("total-formatos").textContent = "Error";
    }
}

async function cargarFormatos() {
    const tbody = document.getElementById("tabla-formatos-body");
    tbody.innerHTML = '';

    try {
        const res = await fetch("http://localhost:5000/formatos");
        const formatos = await res.json();

        if (!formatos.length) {
            tbody.innerHTML = '<tr><td colspan="7">Sin formatos registrados</td></tr>';
            return;
        }

        let htmlContent = '';
        formatos.forEach((formato, i) => {
            const fechaCreacion = formato.FECHA_CREACION ? 
                new Date(formato.FECHA_CREACION).toLocaleDateString('es-MX') : '-';

            htmlContent += ` 
            <tr>
                <td>${fechaCreacion}</td>
                <td>${formato.NOMB_CONTRI || 'Sin nombre'}</td>
                <td>${formato.UBICACION_LOTE || '-'}</td>
                <td>${formato.TIPO_TRAMITE || 'Sin especificar'}</td>
                <td><span style="background-color: #28a745; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">COMPLETADO</span></td>
                <td>
                    <div class="flexDiv" id="formato-${i}">
                        <button class="sec_btn" onclick="openMulti('formato-${i}')">Opciones</button>
                        <div class="selectWrapper">
                            <div class="multiSelect" id="formato-${i}-menu">
                                <div onclick="verFormato('${formato._id}')">Ver detalle</div>
                                <div onclick="editarFormato('${formato._id}')">Editar</div>
                                <div onclick="descargarFormato('${formato._id}')">Descargar</div>
                                <div onclick="eliminarFormato('${formato._id}')" style="color:#dc3545;">Eliminar</div>
                            </div>
                        </div>
                    </div>
                </td>
            </tr>`;
        });
        tbody.innerHTML = htmlContent;
    } catch (error) {
        console.error("Error al cargar formatos:", error);
        tbody.innerHTML = '<tr><td colspan="7">Error al cargar formatos</td></tr>';
    }
}

async function buscarFormato() {
    const filtro = document.getElementById("txtbuscar").value.toLowerCase().trim();
    if (!filtro) return cargarFormatos();
    
    try {
        const res = await fetch(`http://localhost:5000/formatos?search=${filtro}`);
        const formatos = await res.json();
        mostrarResultadosFormatos(formatos);
    } catch (err) {
        console.error("Error al buscar formatos:", err);
    }
}

function mostrarResultadosFormatos(formatos) {
    const tbody = document.getElementById("tabla-formatos-body");
    tbody.innerHTML = "";
    
    if (!formatos.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Sin resultados</td></tr>';
        return;
    }

    formatos.forEach((formato, i) => {
        const fechaCreacion = formato.FECHA_CREACION ? 
            new Date(formato.FECHA_CREACION).toLocaleDateString('es-MX') : '-';

        tbody.innerHTML += `
        <tr>
            <td>${fechaCreacion}</td>
            <td>${formato.NOMB_CONTRI || 'Sin nombre'}</td>
            <td>${formato.UBICACION_LOTE || '-'}</td>
            <td>${formato.TIPO_TRAMITE || 'Sin especificar'}</td>
            <td><span style="background-color: #28a745; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">COMPLETADO</span></td>
            <td>
                <div class="flexDiv" id="formato-${i}">
                    <button class="sec_btn" onclick="openMulti('formato-${i}')">Opciones</button>
                    <div class="selectWrapper">
                        <div class="multiSelect" id="formato-${i}-menu">
                            <div onclick="verFormato('${formato._id}')">Ver detalle</div>
                            <div onclick="editarFormato('${formato._id}')">Editar</div>
                            <div onclick="descargarFormato('${formato._id}')">Descargar</div>
                            <div onclick="eliminarFormato('${formato._id}')" style="color:#dc3545;">Eliminar</div>
                        </div>
                    </div>
                </div>
            </td>
        </tr>`;
    });
}

function verFormato(id) {
    window.location.href = `btn/verFormato.html?id=${id}`;
}

function editarFormato(id) {
    window.location.href = `btn/editarFormato.html?id=${id}`;
}

async function descargarFormato(id) {
    try {
        // Primero obtener los datos del formato
        const resFormato = await fetch(`http://localhost:5000/formatos/${id}`);
        if (!resFormato.ok) {
            throw new Error('Error al obtener los datos del formato');
        }
        
        const formatoData = await resFormato.json();
        
        console.log('Datos de formato para generar documento:', formatoData);
        
        // Luego generar el documento
        const response = await fetch('http://localhost:5000/generar-formato', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formatoData)
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Formato_${formatoData.TIPO_TRAMITE || 'Sin_Tipo'}_${formatoData.NOMB_CONTRI || 'Sin_Nombre'}_${new Date().toISOString().split('T')[0]}.docx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            mostrarMensaje("Documento descargado correctamente");
        } else {
            const error = await response.json();
            mostrarMensaje(`Error al generar documento: ${error.error}`);
        }
    } catch (error) {
        console.error('Error al descargar:', error);
        mostrarMensaje('Error al descargar el documento');
    }
}

function eliminarFormato(id) {
    idAEliminar = id;
    document.getElementById("modal-confirmacion").classList.remove("oculto");
}

async function eliminarConfirmado() {
    try {
        const res = await fetch(`http://localhost:5000/formatos/${idAEliminar}`, {
            method: 'DELETE'
        });
        if (res.ok) {
            cargarFormatos();
            cargarContadores();
            mostrarMensaje("Formato eliminado.");
        } else {
            mostrarMensaje("Error al eliminar formato.");
        }
    } catch {
        mostrarMensaje("Error en la solicitud.");
    } finally {
        document.getElementById("modal-confirmacion").classList.add("oculto");
        idAEliminar = null;
    }
}

function mostrarMensaje(msg) {
    const mensaje = document.getElementById("mensaje-flotante");
    mensaje.textContent = msg;
    mensaje.classList.add("visible");
    setTimeout(() => mensaje.classList.remove("visible"), 3000);
}

function openMulti(id) {
    currentMenuId = id;
    const wrapper = document.querySelector(`#${id} .selectWrapper`);
    document.querySelectorAll('.selectWrapper').forEach(w => {
        if (w !== wrapper) {
            w.style.opacity = 0;
            w.style.pointerEvents = "none";
        }
    });

    const isVisible = wrapper.style.pointerEvents === "all";
    wrapper.style.opacity = isVisible ? 0 : 1;
    wrapper.style.pointerEvents = isVisible ? "none" : "all";
}

document.addEventListener("click", e => {
    if (!e.target.closest('.flexDiv')) {
        document.querySelectorAll('.selectWrapper').forEach(w => {
            w.style.opacity = 0;
            w.style.pointerEvents = "none";
        });
    }
});