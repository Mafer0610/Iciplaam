function showTab(tabName) {
    // Ocultar todos los contenidos
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Remover clase activa de todos los tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Mostrar el contenido seleccionado
    document.getElementById(tabName).classList.add('active');
    
    // Activar el tab correspondiente
    event.target.classList.add('active');
}

// Limpiar formulario
function limpiarFormulario(formId) {
    document.getElementById(formId).reset();
    mostrarMensaje('Formulario limpiado correctamente', 'success');
}

// Mostrar mensajes de estado
function mostrarMensaje(mensaje, tipo) {
    const messageDiv = document.getElementById('status-message');
    messageDiv.textContent = mensaje;
    messageDiv.className = `status-message status-${tipo}`;
    messageDiv.style.display = 'block';
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

// Recopilar datos del formulario de ficha
function recopilarDatosFicha() {
    const form = document.getElementById('fichaForm');
    const formData = new FormData(form);
    const datos = {};
    
    for (let [key, value] of formData.entries()) {
        datos[key] = value;
    }
    
    return datos;
}

// Recopilar datos del formulario de trámite
function recopilarDatosTramite() {
    const datos = {};
    
    // Datos básicos
    datos.NOMB_CONTRI = document.getElementById('NOMB_CONTRI').value;
    datos.DIRECCION = document.getElementById('DIRECCION').value;
    datos.UBICACION_LOTE = document.getElementById('UBICACION_LOTE').value;
    datos.MEDIDA_TRAMITE = document.getElementById('MEDIDA_TRAMITE').value;
    datos.OTROS = document.getElementById('OTROS').value;
    
    // Tipo de trámite (checkboxes)
    datos.TIPO_TRAMITE = [];
    document.querySelectorAll('input[name="TIPO_TRAMITE"]:checked').forEach(cb => {
        datos.TIPO_TRAMITE.push(cb.value);
    });
    
    // Documentos entregados (checkboxes)
    datos.DOCUMENTOS = [];
    document.querySelectorAll('input[name="DOCUMENTOS"]:checked').forEach(cb => {
        datos.DOCUMENTOS.push(cb.value);
    });
    
    // Carta responsiva (checkboxes)
    datos.CARTA_RESPONSIVA = [];
    document.querySelectorAll('input[name="CARTA_RESPONSIVA"]:checked').forEach(cb => {
        datos.CARTA_RESPONSIVA.push(cb.value);
    });
    
    return datos;
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
    // Formulario de ficha
    document.getElementById('fichaForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const datos = recopilarDatosFicha();
        generarFicha(datos);
    });

    // Formulario de trámite
    document.getElementById('tramiteForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const datos = recopilarDatosTramite();
        generarTramite(datos);
    });

    // Validación en tiempo real
    document.querySelectorAll('input[required]').forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value.trim() === '') {
                this.style.borderColor = '#e74c3c';
            } else {
                this.style.borderColor = '#27ae60';
            }
        });
    });

    console.log('Sistema de generación de documentos iniciado');
});
document.addEventListener('DOMContentLoaded', function () {
    const redificacionCheckbox = document.getElementById('REDIFICACION');
    const redificacionOptions = document.getElementById('redificacion-options');

    redificacionCheckbox.addEventListener('change', function () {
        redificacionOptions.style.display = this.checked ? 'block' : 'none';
    });
});
