function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

function limpiarFormulario(formId) {
    document.getElementById(formId).reset();
    mostrarMensaje('Formulario limpiado correctamente', 'success');
}

function mostrarMensaje(mensaje, tipo) {
    const messageDiv = document.getElementById('status-message');
    messageDiv.textContent = mensaje;
    messageDiv.className = `status-message status-${tipo}`;
    messageDiv.style.display = 'block';
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}
const conceptosMap = {
    REP_BOLETA: 'Reposición de Boleta',
    INHUMACION: 'Inhumación',
    TRASP_LOTE: 'Traspaso de Lote',
    TRASPA_SISTEMA: 'Alta en el Sistema',
    CONSTRUC_GAVETA: 'Construcción de Gaveta',
    CONSTRUC_DEPOSITO: 'Construcción de Depósito',
    EXHUMA_CENIZAS: 'Exhumación de Cenizas',
    EXHUMA_DEPOSITO: 'Exhumación de Depósito',
    RECTIFICACION: 'Rectificación',
    RECT_NUMERO: 'Rectificación de Número',
    RECT_FILA: 'Rectificación de Fila',
    RECT_UBICACION: 'Rectificación de Ubicación'
};


// Recopilar datos del formulario de ficha
function recopilarDatosFicha() {
    const form = document.getElementById('fichaForm');
    const formData = new FormData(form);
    const datos = {};

    for (let [key, value] of formData.entries()) {
        datos[key] = value;
    }
    datos.CONCEP = [];
    document.querySelectorAll('input[name="CONCEP"]:checked').forEach(cb => {
        datos.CONCEP.push(cb.value);
    });

    datos.FICHA_RECT_TIPO = [];
    document.querySelectorAll('input[name="FICHA_RECT_TIPO"]:checked').forEach(cb => {
        datos.FICHA_RECT_TIPO.push(cb.value);
    });

    const hoy = new Date();
    const opcionesFecha = { year: 'numeric', month: 'long', day: 'numeric' };
    datos.FECHA_ACTU = hoy.toLocaleDateString('es-MX', opcionesFecha);

    datos.CONCEP = datos.CONCEP.join(', ');

    return datos;
}

// Recopilar datos del formulario de control
function recopilarDatosTramite() {
    const datos = {};

    datos.NOMB_CONTRI = document.getElementById('NOMB_CONTRI').value;
    datos.DIRECCION = document.getElementById('DIRECCION').value;
    datos.UBICACION_LOTE = document.getElementById('UBICACION_LOTE').value;
    datos.MEDIDA_TRAMITE = document.getElementById('MEDIDA_TRAMITE').value;
    datos.OTROS = document.getElementById('OTROS').value;

    datos.TIPO_TRAMITE = [];
    document.querySelectorAll('input[name="TIPO_TRAMITE"]:checked').forEach(cb => {
        const valorLegible = conceptosMap[cb.value] || cb.value;
        datos.TIPO_TRAMITE.push(valorLegible);
    });

    datos.CONCEP = datos.TIPO_TRAMITE.join(', ');

    const documentosIds = [
        'BOLETA_PROPIEDAD', 'PAGO_MANTENIMIENTO', 'INE_PROPIETARIO',
        'PARIENTE', 'TESTIGOS', 'NVO_PROPIETARIO',
        'ACTA_DEFUNCION', 'INHUMADO', 'PROPIETARIO_EXHUMADO',
        'ORDEN_INHUMACION', 'OFICIO_SOLICITUD', 'ACTA_NACIMIENTO',
        'ACTA_MATRIMONIO', 'CARTA_PODER', 'FOTO_LOTE',
        'RESP_CONSTRUCCION', 'RESP_EXHUMACION', 'RESP_TRASPASO'
    ];

    documentosIds.forEach(id => {
        const checkbox = document.getElementById(id);
        datos[id] = checkbox ? checkbox.checked : false;
    });

    const hoy = new Date();
    const opcionesFecha = { year: 'numeric', month: 'long', day: 'numeric' };
    datos.FECHA_ACTU = hoy.toLocaleDateString('es-MX', opcionesFecha);

    return datos;
}



// Función para mostrar/ocultar opciones de rectificación
function toggleRectificacionOptions() {
    const rectificacionCheckbox = document.getElementById('RECTIFICACION');
    const rectificacionOptions = document.getElementById('rectificacion-options');
    const rectificacionSubOptions = document.querySelectorAll('input[name="RECT_TIPO"]');
    
    if (rectificacionCheckbox.checked) {
        rectificacionOptions.style.display = 'block';
    } else {
        rectificacionOptions.style.display = 'none';
        // Desmarcar todas las sub-opciones
        rectificacionSubOptions.forEach(option => {
            option.checked = false;
        });
    }
}

// Generar documento de ficha
async function generarFicha(datos) {
    try {
        mostrarMensaje('Generando Ficha de Inspección...', 'success');
        
        const response = await fetch('/generar-ficha', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datos)
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Ficha_Inspeccion_${new Date().toISOString().split('T')[0]}.docx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            mostrarMensaje('Ficha de inspección generada y descargada correctamente', 'success');
        } else {
            const error = await response.json();
            mostrarMensaje(`Error: ${error.error}`, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error al generar la ficha', 'error');
    }
}

// Generar documento de trámite
async function generarTramite(datos) {
    try {
        mostrarMensaje('Generando Documento de Trámite...', 'success');
        
        const response = await fetch('/generar-tramite', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datos)
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Documento_Tramite_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            mostrarMensaje('Documento de trámite generado y descargado correctamente', 'success');
        } else {
            const error = await response.json();
            mostrarMensaje(`Error: ${error.error}`, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error al generar el documento de trámite', 'error');
    }
}

// Event listeners para los formularios
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('fichaForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const datos = recopilarDatosFicha();
        generarFicha(datos);
    });

    document.getElementById('tramiteForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const datos = recopilarDatosTramite();
        generarTramite(datos);
    });

    document.querySelectorAll('input[required]').forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value.trim() === '') {
                this.style.borderColor = '#e74c3c';
            } else {
                this.style.borderColor = '#27ae60';
            }
        });
    });

    window.toggleRectificacionOptions = toggleRectificacionOptions;

    console.log('Sistema de generación de documentos iniciado');
});