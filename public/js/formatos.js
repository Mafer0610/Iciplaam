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
        const resFormatos = await fetch("http://localhost:5000/formatos/count/total");
        const dataFormatos = await resFormatos.json();
        document.getElementById("total-formatos").textContent = dataFormatos.total;
    } catch (err) {
        document.getElementById("total-formatos").textContent = "Error";
    }
}

// ✅ NUEVA FUNCIÓN PARA CAMBIAR ESTADO DE FORMATO
async function cambiarEstadoFormato(id, estadoActual) {
    const nuevoEstado = estadoActual === 'COMPLETO' ? 'INCOMPLETO' : 'COMPLETO';
    
    try {
        const res = await fetch(`http://localhost:5000/formatos/${id}/estado`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ estado: nuevoEstado })
        });
        
        if (res.ok) {
            mostrarMensaje(`Estado cambiado a ${nuevoEstado}`);
            cargarFormatos();
        } else {
            mostrarMensaje("Error al cambiar estado");
        }
    } catch (error) {
        console.error("Error:", error);
        mostrarMensaje("Error en la solicitud");
    }
}

// ✅ Hacer función global
window.cambiarEstadoFormato = cambiarEstadoFormato;

async function cargarFormatos() {
    const tbody = document.getElementById("tabla-formatos-body");
    tbody.innerHTML = '';

    try {
        const res = await fetch("http://localhost:5000/formatos");
        const formatos = await res.json();

        if (!formatos.length) {
            tbody.innerHTML = '<tr><td colspan="6">Sin formatos registrados</td></tr>';
            return;
        }

        let htmlContent = '';
        formatos.forEach((formato, i) => {
            const fechaCreacion = formato.FECHA_CREACION ? 
                new Date(formato.FECHA_CREACION).toLocaleDateString('es-MX') : '-';

            const tipoTramite = Array.isArray(formato.TIPO_TRAMITE) ? 
                formato.TIPO_TRAMITE.join(', ') : formato.TIPO_TRAMITE || 'Sin especificar';

            const estado = formato.ESTADO || 'COMPLETO';
            const colorEstado = estado === 'COMPLETO' ? '#28a745' : '#ffc107';

            htmlContent += `
            <tr>
                <td>${fechaCreacion}</td>
                <td>${formato.NOMB_CONTRI || 'Sin nombre'}</td>
                <td>${formato.UBICACION_LOTE || '-'}</td>
                <td>${tipoTramite}</td>
                <td>
                    <select onchange="cambiarEstadoFormato('${formato._id}', this.value)" 
                            style="background-color: ${colorEstado}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; border: none; cursor: pointer;">
                        <option value="COMPLETO" ${estado === 'COMPLETO' ? 'selected' : ''}>COMPLETO</option>
                        <option value="INCOMPLETO" ${estado === 'INCOMPLETO' ? 'selected' : ''}>INCOMPLETO</option>
                    </select>
                </td>
                <td>
                    <div class="flexDiv" id="formato-${i}">
                        <button class="sec_btn" onclick="openMulti('formato-${i}')">Opciones</button>
                        <div class="selectWrapper">
                            <div class="multiSelect" id="formato-${i}-menu">
                                <div onclick="verFormato('${formato._id}')">Ver detalle</div>
                                <div onclick="editarFormato('${formato._id}')">Editar</div>
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
        tbody.innerHTML = '<tr><td colspan="6">Error al cargar formatos</td></tr>';
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
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Sin resultados</td></tr>';
        return;
    }

    formatos.forEach((formato, i) => {
        const fechaCreacion = formato.FECHA_CREACION ? 
            new Date(formato.FECHA_CREACION).toLocaleDateString('es-MX') : '-';

        const tipoTramite = Array.isArray(formato.TIPO_TRAMITE) ? 
            formato.TIPO_TRAMITE.join(', ') : formato.TIPO_TRAMITE || 'Sin especificar';

        const estado = formato.ESTADO || 'COMPLETO';
        const colorEstado = estado === 'COMPLETO' ? '#28a745' : '#ffc107';

        tbody.innerHTML += `
        <tr>
            <td>${fechaCreacion}</td>
            <td>${formato.NOMB_CONTRI || 'Sin nombre'}</td>
            <td>${formato.UBICACION_LOTE || '-'}</td>
            <td>${tipoTramite}</td>
            <td>
                <select onchange="cambiarEstadoFormato('${formato._id}', this.value)" 
                        style="background-color: ${colorEstado}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; border: none; cursor: pointer;">
                    <option value="COMPLETO" ${estado === 'COMPLETO' ? 'selected' : ''}>COMPLETO</option>
                    <option value="INCOMPLETO" ${estado === 'INCOMPLETO' ? 'selected' : ''}>INCOMPLETO</option>
                </select>
            </td>
            <td>
                <div class="flexDiv" id="formato-${i}">
                    <button class="sec_btn" onclick="openMulti('formato-${i}')">Opciones</button>
                    <div class="selectWrapper">
                        <div class="multiSelect" id="formato-${i}-menu">
                            <div onclick="verFormato('${formato._id}')">Ver detalle</div>
                            <div onclick="editarFormato('${formato._id}')">Editar</div>
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