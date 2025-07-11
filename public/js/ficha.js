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

    document.querySelectorAll('.rectificacion-options').forEach(option => {
        option.style.display = 'none';
        option.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    });
    document.getElementById('OTROS').style.display = 'none';
    document.getElementById('OTROS_CHECK').checked = false;
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
    TRASP_LOTE: 'Traspaso',
    TRASPA_SISTEMA: 'Alta en el Sistema',
    CONSTRUC_GAVETA: 'Construcción',
    CONSTRUC_DEPOSITO: 'Depósito de Cenizas',
    EXHUMA_CENIZAS: 'Exhumación',
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
        const valorLegible = conceptosMap[cb.value] || cb.value;
        datos.CONCEP.push(valorLegible);
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

    // Datos básicos
    datos.NOMB_CONTRI = document.getElementById('NOMB_CONTRI').value || '';
    datos.DIRECCION = document.getElementById('DIRECCION').value || '';
    datos.UBICACION_LOTE = document.getElementById('UBICACION_LOTE').value || '';
    datos.MEDIDA_TRAMITE = document.getElementById('MEDIDA_TRAMITE').value || '';
    datos.OTROS = document.getElementById('OTROS').value || '';

    console.log('=== VERIFICANDO CHECKBOXES DE TIPO DE TRÁMITE ===');
    
    // Mapear los nombres de nuestros checkboxes a los nombres que espera la plantilla Word
    const mapeoTipos = [
        { checkbox: 'INHUMACION', plantilla: 'INHUMACION' },
        { checkbox: 'REP_BOLETA', plantilla: 'REP_BOLETA' },
        { checkbox: 'TRASP_LOTE', plantilla: 'TRASPASO' },
        { checkbox: 'TRASPA_SISTEMA', plantilla: 'ALTA_SISTEMA' },
        { checkbox: 'CONSTRUC_GAVETA', plantilla: 'CONSTRUCCION' },
        { checkbox: 'CONSTRUC_DEPOSITO', plantilla: 'DEPOSITO_CENIZAS' },
        { checkbox: 'EXHUMA_CENIZAS', plantilla: 'EXHUMACION' }
    ];

    // Para el documento Word - usar nombres que espera la plantilla
    mapeoTipos.forEach(item => {
        const checkbox = document.getElementById(item.checkbox);
        if (checkbox) {
            datos[item.plantilla] = checkbox.checked ? 'X' : '';
            console.log(`${item.checkbox} → ${item.plantilla}: checked=${checkbox.checked}, valor="${datos[item.plantilla]}"`);
        } else {
            datos[item.plantilla] = '';
            console.log(`${item.checkbox} → ${item.plantilla}: checkbox NO EXISTE`);
        }
    });

    // Para la base de datos - usar nombres originales
    datos.TIPO_TRAMITE = [];
    mapeoTipos.forEach(item => {
        const checkbox = document.getElementById(item.checkbox);
        if (checkbox && checkbox.checked) {
            datos.TIPO_TRAMITE.push(item.checkbox); // Guardar nombre original en BD
        }
    });

    console.log('Array TIPO_TRAMITE para BD:', datos.TIPO_TRAMITE);

    // Verificar documentos entregados
    console.log('=== VERIFICANDO DOCUMENTOS ENTREGADOS ===');
    const documentosIds = [
        'BOLETA_PROPIEDAD', 'PAGO_MANTENIMIENTO', 'INE_PROPIETARIO',
        'PARIENTE', 'TESTIGOS', 'NVO_PROPIETARIO',
        'ACTA_DEFUNCION', 'INHUMADO', 'PROPIETARIO_EXHUMADO',
        'ORDEN_INHUMACION', 'OFICIO_SOLICITUD', 'ACTA_NACIMIENTO',
        'ACTA_MATRIMONIO', 'CARTA_PODER', 'FOTO_LOTE', 'CARTA_RESPONSIVA',
        'CONSTRUCCION_CARTA', 'EXHUMACION_CARTA', 'TRASPASO_CARTA', 'OTROS_CHECK'
    ];

    // Para el documento Word - marcar con X los seleccionados
    documentosIds.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            datos[id] = checkbox.checked ? 'X' : '';
            console.log(`${id}: checked=${checkbox.checked}, valor="${datos[id]}"`);
        } else {
            datos[id] = '';
            console.log(`${id}: checkbox NO EXISTE`);
        }
    });

    // Para la base de datos - crear array de seleccionados
    datos.DOCUMENTOS_ENTREGADOS = [];
    documentosIds.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox && checkbox.checked) {
            datos.DOCUMENTOS_ENTREGADOS.push(id);
        }
    });

    console.log('Array DOCUMENTOS_ENTREGADOS para BD:', datos.DOCUMENTOS_ENTREGADOS);
    console.log('=== DATOS COMPLETOS ===');
    console.log(JSON.stringify(datos, null, 2));

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
        rectificacionSubOptions.forEach(option => {
            option.checked = false;
        });
    }
}

// Función para guardar ficha en base de datos
async function guardarFicha(datos) {
    try {
        console.log('Enviando ficha a BD:', datos);
        const response = await fetch('http://localhost:5000/fichas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datos)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('Ficha guardada en base de datos:', result);
            mostrarMensaje('Ficha guardada en base de datos correctamente', 'success');
        } else {
            const error = await response.json();
            console.error('Error al guardar ficha:', error);
            mostrarMensaje(`Error al guardar ficha: ${error.error}`, 'error');
        }
    } catch (error) {
        console.error('Error al guardar ficha:', error);
        mostrarMensaje('Error de conexión al guardar ficha', 'error');
    }
}

// Función para guardar control en base de datos
async function guardarControl(datos) {
    try {
        console.log('Enviando control a BD:', datos);
        const response = await fetch('http://localhost:5000/control', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datos)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('Control guardado en base de datos:', result);
            mostrarMensaje('Control guardado en base de datos correctamente', 'success');
        } else {
            const error = await response.json();
            console.error('Error al guardar control:', error);
            mostrarMensaje(`Error al guardar control: ${error.error}`, 'error');
        }
    } catch (error) {
        console.error('Error al guardar control:', error);
        mostrarMensaje('Error de conexión al guardar control', 'error');
    }
}

// Generar documento de ficha
async function generarFicha(datos) {
    try {
        mostrarMensaje('Generando Ficha de Inspección...', 'success');
        
        const response = await fetch('http://localhost:5000/generar-ficha', {
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
            a.download = `Documento_Tramite_${new Date().toISOString().split('T')[0]}.docx`;
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
    // Event listener para ficha de inspección
    document.getElementById('fichaForm').addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('=== ENVIANDO FICHA DE INSPECCIÓN ===');
        const datos = recopilarDatosFicha();
        console.log('Datos de ficha recopilados:', datos);
        
        // Generar documento y guardar en BD
        generarFicha(datos);
        guardarFicha(datos);
    });

    // Event listener para documento de trámite
    document.getElementById('tramiteForm').addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('=== ENVIANDO DOCUMENTO DE TRÁMITE ===');
        const datos = recopilarDatosTramite();
        console.log('Datos de trámite recopilados:', datos);
        
        // Generar documento y guardar en BD
        generarTramite(datos);
        guardarControl(datos);
    });

    // Validación de campos requeridos
    document.querySelectorAll('input[required]').forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value.trim() === '') {
                this.style.borderColor = '#e74c3c';
            } else {
                this.style.borderColor = '#27ae60';
            }
        });
    });

    // Hacer las funciones de toggle disponibles globalmente
    window.toggleRectificacionOptions = toggleRectificacionOptions;

    console.log('Sistema de generación de documentos iniciado');
});