$('.toggle').on('click', function () {
    const $menu = $(this).closest('.menu.adaptado');
    $menu.toggleClass('expanded');
    $(this).toggleClass('close');
});

let idAEliminar = null;
let currentMenuId = null;

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btn-confirmar").addEventListener("click", eliminarConfirmado);
    document.getElementById("btn-cancelar").addEventListener("click", () => {
    document.getElementById("modal-confirmacion").classList.add("oculto");
    idAEliminar = null;
    });
});

async function cargarConteoTramites() {
    try {
    const res = await fetchAutenticado("http://localhost:5000/tramites/count/total");
    const data = await res.json();
    document.getElementById("total-tramites").textContent = data.total;
    } catch (err) {
    document.getElementById("total-tramites").textContent = "Error";
    }
}

async function cargarTramites() {
    const tbody = document.getElementById("tabla-tramites-body");
    tbody.innerHTML = "";
    try {
    const res = await fetchAutenticado("http://localhost:5000/tramites?limit=10");
    const data = await res.json();
    mostrarResultados(data, "");
    } catch (err) {
    console.error("Error al cargar los trámites:", err);
    }
}

async function buscarTramite() {
    const filtro = document.getElementById("txtbuscar").value.toLowerCase().trim();
    if (!filtro) return cargarTramites();
    try {
    const res = await fetchAutenticado(`http://localhost:5000/tramites?busqueda=${filtro}`);
    const data = await res.json();
    mostrarResultados(data, filtro);
    } catch (err) {
    console.error("Error al buscar trámites:", err);
    }
}

function mostrarResultados(datos, filtro) {
    const tbody = document.getElementById("tabla-tramites-body");
    tbody.innerHTML = "";
    
    if (!datos.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Sin resultados</td></tr>';
    return;
    }

    datos.forEach((item, i) => {
    const menuId = `menu-${i}`;
    const fechaFormateada = item.FECHA_ELA ? new Date(item.FECHA_ELA).toLocaleDateString('es-MX') : '';
    
    tbody.innerHTML += `
        <tr>
        <td>${fechaFormateada}</td>
        <td>${item.FOLIO || ''}</td>
        <td>${item.TITULAR || ''}</td>
        <td>${item.RECIBO || ''}</td>
        <td>
            <div class="flexDiv" id="${menuId}">
            <button class="sec_btn" onclick="openMulti('${menuId}')">Opciones</button>
            <div class="selectWrapper">
                <div class="multiSelect" id="${menuId}-0">
                <div onclick="verTramite('${item._id}')">Ver detalles</div>
                <div onclick="editarTramite('${item._id}')">Editar trámite</div>
                <div onclick="eliminarTramite('${item._id}')" style="color:#dc3545;">Eliminar trámite</div>
                </div>
            </div>
            </div>
        </td>
        </tr>`;
    });
}

function verTramite(id) {
    window.location.href = `../btn/verTramite.html?id=${id}`;
}

function editarTramite(id) {
    window.location.href = `../btn/editarTramite.html?id=${id}`;
}

function eliminarTramite(id) {
    idAEliminar = id;
    document.getElementById("modal-confirmacion").classList.remove("oculto");
}

async function eliminarConfirmado() {
    try {
    const res = await fetchAutenticado(`http://localhost:5000/tramites/${idAEliminar}`, {
        method: 'DELETE',
    });
    if (res.ok) {
        cargarTramites();
        cargarConteoTramites();
        mostrarMensaje("Trámite eliminado.");
    } else {
        mostrarMensaje("Error al eliminar.");
    }
    } catch {
    mostrarMensaje("Error en la solicitud.");
    } finally {
    document.getElementById("modal-confirmacion").classList.add("oculto");
    idAEliminar = null;
    }
}

async function descargarExcel() {
    try {
    mostrarMensaje("Generando archivo Excel...");
    const añoActual = new Date().getFullYear();
    const res = await fetchAutenticado(`http://localhost:5000/tramites/excel/${añoActual}`);
    
    if (!res.ok) {
        throw new Error("Error al generar el archivo Excel");
    }
    
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Tramites_${añoActual}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    mostrarMensaje("Archivo Excel descargado correctamente");
    } catch (error) {
    console.error("Error al descargar Excel:", error);
    mostrarMensaje("Error al descargar el archivo Excel");
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