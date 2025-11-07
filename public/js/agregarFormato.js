// agregarFormato.js - Versión Corregida con Gestión de Archivos

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
        // Drag and drop
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
    const allowedTypes = [
        'application/pdf', 
        'image/jpeg', 
        'image/png', 
        'image/jpg',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    files.forEach(file => {
        // Validar tamaño
        if (file.size > maxSize) {
            mostrarMensaje(`El archivo ${file.name} excede el tamaño máximo de 10MB`, 'error');
            return;
        }

        // Validar tipo
        if (!allowedTypes.includes(file.type)) {
            mostrarMensaje(`El archivo ${file.name} no tiene un formato permitido`, 'error');
            return;
        }

        // Evitar duplicados
        const existe = archivosSeleccionados.some(f => 
            f.name === file.name && f.size === file.size
        );
        
        if (!existe) {
            archivosSeleccionados.push(file);
        } else {
            mostrarMensaje(`El archivo ${file.name} ya fue agregado`, 'error');
            return;
        }
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
        
        // Icono según tipo de archivo
        const extension = file.name.split('.').pop().toLowerCase();
        let icono = '📄';
        if (['jpg', 'jpeg', 'png'].includes(extension)) icono = '🖼️';
        if (extension === 'pdf') icono = '📕';
        if (['doc', 'docx'].includes(extension)) icono = '📘';
        
        item.innerHTML = `
            <div class="archivo-info">
                <span class="archivo-icon">${icono}</span>
                <div class="archivo-detalles">
                    <span class="archivo-nombre">${file.name}</span>
                    <span class="archivo-meta">${formatearTamano(file.size)}</span>
                </div>
            </div>
            <button type="button" class="btn-eliminar" onclick="eliminarArchivo(${index})">
                ✕ Eliminar
            </button>
        `;
        lista.appendChild(item);
    });

    console.log(`📎 Total de archivos seleccionados: ${archivosSeleccionados.length}`);
}

function eliminarArchivo(index) {
    const archivoEliminado = archivosSeleccionados[index];
    archivosSeleccionados.splice(index, 1);
    actualizarListaArchivos();
    mostrarMensaje(`Archivo "${archivoEliminado.name}" eliminado de la lista`, 'success');
}

function formatearTamano(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// ===== SUBIR ARCHIVOS A GOOGLE DRIVE =====
async function subirArchivos(formatoId) {
    if (archivosSeleccionados.length === 0) {
        console.log('No hay archivos para subir');
        return { exito: true, mensaje: 'No hay archivos para subir' };
    }

    console.log(`📤 Iniciando subida de ${archivosSeleccionados.length} archivos...`);
    
    const tiposTramite = recopilarTiposTramite();
    const tipoTramiteStr = tiposTramite.join(', ') || 'General';
    
    let archivosSubidos = 0;
    let errores = [];

    const progressBar = document.getElementById('uploadProgressBar');
    const uploadProgress = document.getElementById('uploadProgress');
    uploadProgress.style.display = 'block';

    for (let i = 0; i < archivosSeleccionados.length; i++) {
        const file = archivosSeleccionados[i];
        
        try {
            console.log(`Subiendo archivo ${i + 1}/${archivosSeleccionados.length}: ${file.name}`);
            
            // Crear FormData para cada archivo
            const formData = new FormData();
            formData.append('file', file);
            formData.append('formatoId', formatoId);
            formData.append('tipoTramite', tipoTramiteStr);

            // Subir a servidor
            const response = await fetch('http://localhost:5000/subir-documento-drive', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al subir archivo');
            }

            const resultado = await response.json();
            console.log(`✅ Archivo "${file.name}" subido exitosamente`);
            console.log('Drive ID:', resultado.documento.drive_file_id);
            
            archivosSubidos++;
            
            // Actualizar barra de progreso
            const progreso = ((i + 1) / archivosSeleccionados.length) * 100;
            progressBar.style.width = `${progreso}%`;
            
        } catch (error) {
            console.error(`❌ Error al subir "${file.name}":`, error);
            errores.push(`${file.name}: ${error.message}`);
        }
    }

    // Ocultar barra de progreso
    setTimeout(() => {
        uploadProgress.style.display = 'none';
        progressBar.style.width = '0%';
    }, 2000);

    if (errores.length > 0) {
        console.error('Errores durante la subida:', errores);
        return {
            exito: false,
            mensaje: `Se subieron ${archivosSubidos} de ${archivosSeleccionados.length} archivos. Errores: ${errores.join('; ')}`
        };
    }

    return {
        exito: true,
        mensaje: `${archivosSubidos} archivos subidos exitosamente`
    };
}

function recopilarTiposTramite() {
    const tipos = [];
    const checkboxes = [
        'INHUMACION', 'REP_BOLETA', 'TRASP_LOTE', 'TRASPA_SISTEMA',
        'CONSTRUC_GAVETA', 'CONSTRUC_DEPOSITO', 'EXHUMA_CENIZAS'
    ];
    
    checkboxes.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox && checkbox.checked) {
            tipos.push(id);
        }
    });
    
    return tipos;
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
        console.log('💾 Guardando formato en base de datos...');
        const response = await fetch('http://localhost:5000/control', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datos)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Formato guardado - ID:', result.id);
            mostrarMensaje('Formato guardado en base de datos', 'success');
            return result.id;
        } else {
            const error = await response.json();
            console.error('Error al guardar formato:', error);
            mostrarMensaje(`Error al guardar formato: ${error.error}`, 'error');
            return null;
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        mostrarMensaje('Error de conexión al guardar formato', 'error');
        return null;
    }
}

// ===== GENERAR DOCUMENTO WORD =====
async function generarFormato(datos) {
    try {
        mostrarMensaje('Generando documento...', 'success');
        
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
            a.download = `Formato_Control_${new Date().toISOString().split('T')[0]}.docx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            mostrarMensaje('Documento generado y descargado', 'success');
            return true;
        } else {
            const error = await response.json();
            mostrarMensaje(`Error: ${error.error}`, 'error');
            return false;
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error al generar el documento', 'error');
        return false;
    }
}

// ===== GUARDAR SOLO FORMATO =====
async function guardarSoloFormato() {
    console.log('=== GUARDANDO FORMATO CON ARCHIVOS ===');
    
    if (!validarFormulario()) {
        return;
    }
    
    const datos = recopilarDatosFormato();
    const formatoId = await guardarFormato(datos);
    
    if (!formatoId) {
        mostrarMensaje('Error: No se pudo guardar el formato', 'error');
        return;
    }
    
    // Subir archivos si hay
    if (archivosSeleccionados.length > 0) {
        mostrarMensaje(`Subiendo ${archivosSeleccionados.length} archivos...`, 'success');
        const resultadoSubida = await subirArchivos(formatoId);
        
        if (!resultadoSubida.exito) {
            mostrarMensaje(resultadoSubida.mensaje, 'error');
            return;
        }
        
        mostrarMensaje('Formato y archivos guardados exitosamente', 'success');
    } else {
        mostrarMensaje('Formato guardado sin archivos', 'success');
    }
    
    setTimeout(() => {
        window.location.href = '../panelFormatos.html';
    }, 2000);
}

function validarFormulario() {
    const camposRequeridos = [
        { id: 'NOMB_CONTRI', nombre: 'Nombre del Contribuyente' },
        { id: 'DIRECCION', nombre: 'Dirección' },
        { id: 'UBICACION_LOTE', nombre: 'Ubicación del Lote' },
        { id: 'MEDIDA_TRAMITE', nombre: 'Medida' }
    ];
    
    let errores = [];
    
    camposRequeridos.forEach(campo => {
        const input = document.getElementById(campo.id);
        if (!input || !input.value.trim()) {
            errores.push(campo.nombre);
            if (input) input.style.borderColor = '#e74c3c';
        } else {
            if (input) input.style.borderColor = '#27ae60';
        }
    });
    
    const tiposSeleccionados = recopilarTiposTramite();
    if (tiposSeleccionados.length === 0) {
        errores.push('Debe seleccionar al menos un tipo de trámite');
    }
    
    if (errores.length > 0) {
        mostrarMensaje(`Complete los campos: ${errores.join(', ')}`, 'error');
        return false;
    }
    
    return true;
}

// ===== EVENT LISTENER PRINCIPAL =====
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('formatoForm');
    
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!validarFormulario()) {
                return;
            }
            
            console.log('=== ENVIANDO FORMATO COMPLETO ===');
            const datos = recopilarDatosFormato();
            
            // 1. Guardar formato en BD
            const formatoId = await guardarFormato(datos);
            
            if (!formatoId) {
                mostrarMensaje('Error al guardar formato en base de datos', 'error');
                return;
            }
            
            // 2. Subir archivos si hay
            if (archivosSeleccionados.length > 0) {
                const resultadoSubida = await subirArchivos(formatoId);
                if (!resultadoSubida.exito) {
                    mostrarMensaje(resultadoSubida.mensaje, 'error');
                }
            }
            
            // 3. Generar documento Word
            const generado = await generarFormato(datos);
            
            if (generado) {
                setTimeout(() => {
                    window.location.href = '../panelFormatos.html';
                }, 2000);
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

    console.log('✅ Sistema de formatos con archivos iniciado');
});