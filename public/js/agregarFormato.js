// agregarFormato.js - Versión Completa con Gestión de Archivos

let archivosSeleccionados = [];

function mostrarMensaje(mensaje, tipo) {
    const messageDiv = document.getElementById('status-message');
    messageDiv.textContent = mensaje;
    messageDiv.className = `status-message status-${tipo}`;
    messageDiv.style.display = 'block';
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

// ===== GESTIÓN DE ARCHIVOS =====
document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');

    if (uploadArea) {
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            const files = Array.from(e.dataTransfer.files);
            manejarArchivos(files);
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            manejarArchivos(files);
        });
    }
});

function manejarArchivos(files) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 
                          'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    files.forEach(file => {
        if (file.size > maxSize) {
            mostrarMensaje(`El archivo ${file.name} excede el tamaño máximo de 10MB`, 'error');
            return;
        }

        if (!allowedTypes.includes(file.type)) {
            mostrarMensaje(`El archivo ${file.name} no tiene un formato permitido`, 'error');
            return;
        }

        archivosSeleccionados.push(file);
    });

    actualizarListaArchivos();
}

function actualizarListaArchivos() {
    const lista = document.getElementById('archivosLista');
    if (!lista) return;
    
    lista.innerHTML = '';

    if (archivosSeleccionados.length === 0) {
        return;
    }

    archivosSeleccionados.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'archivo-item';
        item.innerHTML = `
            <div class="archivo-info">
                <span class="archivo-nombre">📄 ${file.name}</span>
                <span style="color: #666; font-size: 12px;">(${formatearTamano(file.size)})</span>
            </div>
            <button type="button" class="btn-eliminar-archivo" onclick="eliminarArchivo(${index})">
                Eliminar
            </button>
        `;
        lista.appendChild(item);
    });
}

function eliminarArchivo(index) {
    archivosSeleccionados.splice(index, 1);
    actualizarListaArchivos();
}

function formatearTamano(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// ===== RECOPILAR DATOS DEL FORMATO =====
function recopilarDatosFormato() {
    const datos = {};

    datos.NOMB_CONTRI = document.getElementById('NOMB_CONTRI').value || '';
    datos.DIRECCION = document.getElementById('DIRECCION').value || '';
    datos.UBICACION_LOTE = document.getElementById('UBICACION_LOTE').value || '';
    datos.MEDIDA_TRAMITE = document.getElementById('MEDIDA_TRAMITE').value || '';
    datos.OTROS = document.getElementById('OTROS').value || '';

    const mapeoTipos = [
        { checkbox: 'INHUMACION', plantilla: 'INHUMACION' },
        { checkbox: 'REP_BOLETA', plantilla: 'REP_BOLETA' },
        { checkbox: 'TRASP_LOTE', plantilla: 'TRASPASO' },
        { checkbox: 'TRASPA_SISTEMA', plantilla: 'ALTA_SISTEMA' },
        { checkbox: 'CONSTRUC_GAVETA', plantilla: 'CONSTRUCCION' },
        { checkbox: 'CONSTRUC_DEPOSITO', plantilla: 'DEPOSITO_CENIZAS' },
        { checkbox: 'EXHUMA_CENIZAS', plantilla: 'EXHUMACION' }
    ];

    mapeoTipos.forEach(item => {
        const checkbox = document.getElementById(item.checkbox);
        if (checkbox) {
            datos[item.plantilla] = checkbox.checked ? 'X' : '';
        } else {
            datos[item.plantilla] = '';
        }
    });

    datos.TIPO_TRAMITE = [];
    mapeoTipos.forEach(item => {
        const checkbox = document.getElementById(item.checkbox);
        if (checkbox && checkbox.checked) {
            datos.TIPO_TRAMITE.push(item.checkbox);
        }
    });

    const documentosIds = [
        'BOLETA_PROPIEDAD', 'PAGO_MANTENIMIENTO', 'INE_PROPIETARIO',
        'PARIENTE', 'TESTIGOS', 'NVO_PROPIETARIO', 'ACTA_DEFUNCION',
        'INHUMADO', 'PROPIETARIO_EXHUMADO', 'ORDEN_INHUMACION',
        'OFICIO_SOLICITUD', 'ACTA_NACIMIENTO', 'ACTA_MATRIMONIO',
        'CARTA_PODER', 'FOTO_LOTE', 'CARTA_RESPONSIVA',
        'CONSTRUCCION_CARTA', 'EXHUMACION_CARTA', 'TRASPASO_CARTA', 'OTROS_CHECK'
    ];

    documentosIds.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            datos[id] = checkbox.checked ? 'X' : '';
        } else {
            datos[id] = '';
        }
    });

    datos.DOCUMENTOS_ENTREGADOS = [];
    documentosIds.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox && checkbox.checked) {
            datos.DOCUMENTOS_ENTREGADOS.push(id);
        }
    });

    return datos;
}

// ===== GUARDAR FORMATO EN BD =====
async function guardarFormato(datos) {
    try {
        console.log('Enviando formato a BD:', datos);
        const response = await fetch('http://localhost:5000/control', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datos)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('Formato guardado en base de datos:', result);
            mostrarMensaje('Formato guardado en base de datos correctamente', 'success');
            return result.id;
        } else {
            const error = await response.json();
            console.error('Error al guardar formato:', error);
            mostrarMensaje(`Error al guardar formato: ${error.error}`, 'error');
            return null;
        }
    } catch (error) {
        console.error('Error al guardar formato:', error);
        mostrarMensaje('Error de conexión al guardar formato', 'error');
        return null;
    }
}

// ===== GENERAR DOCUMENTO WORD =====
async function generarFormato(datos) {
    try {
        mostrarMensaje('Generando Formato de Control...', 'success');
        
        const response = await fetch('http://localhost:5000/generar-tramite', {
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
            a.download = `Formato_de_Control_${new Date().toISOString().split('T')[0]}.docx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            mostrarMensaje('Formato de control generado y descargado correctamente', 'success');
            return true;
        } else {
            const error = await response.json();
            mostrarMensaje(`Error: ${error.error}`, 'error');
            return false;
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error al generar el formato de control', 'error');
        return false;
    }
}

// ===== GUARDAR SOLO FORMATO (SIN GENERAR DOCUMENTO) =====
async function guardarSoloFormato() {
    console.log('=== GUARDANDO SOLO FORMATO ===');
    const datos = recopilarDatosFormato();
    console.log('Datos de formato recopilados:', datos);
    
    const formatoId = await guardarFormato(datos);
    
    if (formatoId) {
        setTimeout(() => {
            window.location.href = '../panelFormatos.html';
        }, 2000);
    }
}

// ===== EVENT LISTENER PRINCIPAL =====
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('formatoForm');
    
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('=== ENVIANDO FORMATO DE CONTROL ===');
            const datos = recopilarDatosFormato();
            console.log('Datos de formato recopilados:', datos);
            
            const guardado = await guardarFormato(datos);
            
            if (guardado) {
                const generado = await generarFormato(datos);
                
                if (generado) {
                    setTimeout(() => {
                        window.location.href = '../panelFormatos.html';
                    }, 2000);
                }
            }
        });
    }

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

    console.log('Sistema de generación de formatos iniciado');
});