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
    } catch (err) {
        document.getElementById("total-lapidas").textContent = "Error";
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