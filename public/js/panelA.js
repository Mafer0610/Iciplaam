$('.toggle').on('click', function () {
    const $menu = $(this).closest('.menu.adaptado');
    $menu.toggleClass('expanded');
    $(this).toggleClass('close');
});

function mostrarRegistros() {
    document.getElementById("tabla-registros").classList.add("active");
    document.getElementById("tabla-fichas").classList.remove("active");
    document.getElementById("btn-registros").classList.add("active");
    document.getElementById("btn-fichas").classList.remove("active");
}

function mostrarFichas() {
    document.getElementById("tabla-registros").classList.remove("active");
    document.getElementById("tabla-fichas").classList.add("active");
    document.getElementById("btn-fichas").classList.add("active");
    document.getElementById("btn-registros").classList.remove("active");

cargarFichas();
}

function cerrarSesion() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "index.html";
}
let idAEliminar = null;
let currentMenuId = null;

document.addEventListener("DOMContentLoaded", () => {
    cargarTabla();
    cargarContadores();

    document.getElementById("btn-confirmar").addEventListener("click", eliminarConfirmado);
    document.getElementById("btn-cancelar").addEventListener("click", () => {
    document.getElementById("modal-confirmacion").classList.add("oculto");
    idAEliminar = null;
    });
});

async function cargarContadores() {
    try {
    // Cargar contador de lápidas
    const resLapidas = await fetch("http://localhost:5000/lapidas/count/total");
    const dataLapidas = await resLapidas.json();
    document.getElementById("total-lapidas").textContent = dataLapidas.total;

    // Cargar contador de fichas
    const resFichas = await fetch("http://localhost:5000/fichas/count/total");
    const dataFichas = await resFichas.json();
    document.getElementById("total-fichas").textContent = dataFichas.total;
    } catch (err) {
    document.getElementById("total-lapidas").textContent = "Error";
    document.getElementById("total-fichas").textContent = "Error";
    }
}

async function cargarTabla() {
    const tbody = document.getElementById("tabla-lapidas");
    tbody.innerHTML = "";
    try {
    const res = await fetch("http://localhost:5000/lapidas?limit=5");
    const data = await res.json();
    mostrarResultados(data, "");
    } catch (err) {
    console.error("Error al cargar los datos:", err);
    }
}

async function buscarRegistro() {
    const filtro = document.getElementById("txtbuscar").value.toLowerCase().trim();
    if (!filtro) return cargarTabla();
    try {
    const res = await fetch(`http://localhost:5000/lapidas?nombre=${filtro}`);
    const data = await res.json();
    mostrarResultados(data, filtro);
    } catch (err) {
    console.error("Error al buscar registros:", err);
    }
}

function mostrarResultados(datos, filtro) {
    const tbody = document.getElementById("tabla-lapidas");
    tbody.innerHTML = "";
    if (!datos.length) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">Sin resultados</td></tr>';
    return;
    }

    datos.forEach((item, i) => {
    const menuId = `menu-${i}`;
    tbody.innerHTML += `
        <tr>
        <td>${item.NOM_REG}</td>
        <td>${item.NOMBRE_PROPIE}</td>
        <td>${item.EDO_CONTRI}</td>
        <td>${item.MEDIDAS}</td>
        <td>${item.ZONA}</td>
        <td>${item.FILA}</td>
        <td>${item.X}</td>
        <td>${item.Y}</td>
        <td>
            <div class="flexDiv" id="${menuId}">
            <button class="sec_btn" onclick="openMulti('${menuId}')">Opciones</button>
            <div class="selectWrapper">
                <div class="multiSelect" id="${menuId}-0">
                <div onclick="verRegistro('${item.NOM_REG}')">Ver detalles</div>
                <div onclick="editarRegistro('${item.NOM_REG}')">Editar registro</div>
                <div onclick="eliminarRegistro('${item._id}')" style="color:#dc3545;">Eliminar registro</div>
                </div>
            </div>
            </div>
        </td>
        </tr>`;
    });
}

function verRegistro(nom) {
    window.location.href = `btn/verInfo.html?NOM_REG=${nom}`;
}

function editarRegistro(nom) {
    window.location.href = `btn/editarInfo.html?NOM_REG=${nom}`;
}

function eliminarRegistro(id) {
    idAEliminar = id;
    document.getElementById("modal-confirmacion").classList.remove("oculto");
}

async function eliminarConfirmado() {
    try {
    const res = await fetch(`http://localhost:5000/lapidas/${idAEliminar}`, {
        method: 'DELETE',
    });
    if (res.ok) {
        cargarTabla();
        cargarContadores();
        mostrarMensaje("Registro eliminado.");
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

async function cargarFichas() {
    const tbody = document.getElementById("tabla-fichas-body");
    tbody.innerHTML = "";

    try {
        const res = await fetch("http://localhost:5000/fichas");
        const fichas = await res.json();

        if (!fichas.length) {
            tbody.innerHTML = '<tr><td colspan="6">Sin fichas registradas</td></tr>';
            return;
        }

        fichas.forEach((ficha, i) => {
            if (!ficha._id) {
                console.error('⚠️ Ficha sin ID detectada:', ficha);
                return;
            }
            
            const fechaInhu = ficha.FECHA_INHU ? 
                new Date(ficha.FECHA_INHU).toLocaleDateString('es-MX') : '-';
            
            const conceptos = ficha.CONCEPTOS && ficha.CONCEPTOS.length > 0 ? 
                ficha.CONCEPTOS.slice(0, 2).join(', ') + (ficha.CONCEPTOS.length > 2 ? '...' : '') : 
                'Sin conceptos';

            tbody.innerHTML += `
            <tr>
                <td>${ficha.NO_FICHI || 'S/N'}</td>
                <td>${ficha.ACTU_PROPIE || 'Sin propietario'}</td>
                <td>${ficha.LOTE_ACT || '-'}</td>
                <td>${fechaInhu}</td>
                <td title="${ficha.CONCEPTOS ? ficha.CONCEPTOS.join(', ') : ''}">${conceptos}</td>
                <td>
                    <div class="flexDiv" id="ficha-${i}">
                        <button class="sec_btn" onclick="openMulti('ficha-${i}')">Opciones</button>
                        <div class="selectWrapper">
                            <div class="multiSelect" id="ficha-${i}-menu">
                                <div onclick="verFicha('${ficha._id}')">Ver detalle</div>
                                <div onclick="editarFicha('${ficha._id}')">Editar</div>
                                <div onclick="descargarFicha('${ficha._id}')">Descargar</div>
                                <div onclick="eliminarFicha('${ficha._id}')" style="color:#dc3545;">Eliminar</div>
                            </div>
                        </div>
                    </div>
                </td>
            </tr>`;
        });
    } catch (error) {
        console.error("Error al cargar fichas:", error);
        tbody.innerHTML = '<tr><td colspan="6">Error al cargar fichas</td></tr>';
    }
}

function verFicha(id) {
    console.log('Panel Admin - Navegando a ver ficha con ID:', id);
    
    if (!id || id === 'null' || id === 'undefined') {
        alert('Error: ID de ficha no válido');
        console.error('ID inválido recibido:', id);
        return;
    }
    
    const fichaId = String(id);
    console.log('ID procesado:', fichaId);
    
    window.location.href = `btn/verFicha.html?id=${fichaId}`;
}

function editarFicha(id) {
    window.location.href = `btn/editarFicha.html?id=${id}`;
}

async function descargarFicha(id) {
    try {
    // Primero obtener los datos de la ficha
    const resFicha = await fetch(`http://localhost:5000/fichas/${id}`);
    if (!resFicha.ok) {
        throw new Error('Error al obtener los datos de la ficha');
    }
    
    const fichaData = await resFicha.json();
    
    // Convertir CONCEPTOS (array) a CONCEP (string) para el documento Word
    if (fichaData.CONCEPTOS && Array.isArray(fichaData.CONCEPTOS)) {
        fichaData.CONCEP = fichaData.CONCEPTOS.join(', ');
    } else {
        fichaData.CONCEP = 'Sin conceptos especificados';
    }
    
    console.log('Datos de ficha para generar documento:', fichaData);
    
    // Luego generar el documento
    const response = await fetch('http://localhost:5000/generar-ficha', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify(fichaData)
    });
    
    if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Ficha_${fichaData.NO_FICHI || 'Sin_Numero'}_${new Date().toISOString().split('T')[0]}.docx`;
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

function eliminarFicha(id) {
    idAEliminar = id;
    document.getElementById("modal-confirmacion").classList.remove("oculto");

    document.getElementById("btn-confirmar").onclick = async () => {
    try {
        const res = await fetch(`http://localhost:5000/fichas/${id}`, {
        method: 'DELETE'
        });
        if (res.ok) {
        cargarFichas();
        cargarContadores();
        mostrarMensaje("Ficha eliminada.");
        } else {
        mostrarMensaje("Error al eliminar ficha.");
        }
    } catch {
        mostrarMensaje("Error en la solicitud.");
    } finally {
        document.getElementById("modal-confirmacion").classList.add("oculto");
        idAEliminar = null;
    }
    };
}