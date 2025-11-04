let formatoId = null;

const tiposTramiteIds = ['INHUMACION', 'REP_BOLETA', 'TRASP_LOTE', 'TRASPA_SISTEMA', 'CONSTRUC_GAVETA', 'CONSTRUC_DEPOSITO', 'EXHUMA_CENIZAS'];

const documentosIds = [
    'BOLETA_PROPIEDAD', 'PAGO_MANTENIMIENTO', 'INE_PROPIETARIO',
    'ACTA_DEFUNCION', 'ORDEN_INHUMACION', 'OFICIO_SOLICITUD',
    'ACTA_NACIMIENTO', 'ACTA_MATRIMONIO', 'CARTA_PODER',
    'FOTO_LOTE', 'CARTA_RESPONSIVA'
];

document.addEventListener('DOMContentLoaded', function() {
    const auth = verificarAutenticacion();
    if (!auth) return;

    const urlParams = new URLSearchParams(window.location.search);
    formatoId = urlParams.get('id');
    
    if (!formatoId) {
        mostrarError('ID de formato no proporcionado');
        return;
    }

    cargarFormato();
});

async function cargarFormato() {
    try {
        const response = await fetch(`http://localhost:5000/formatos/${formatoId}`);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const formato = await response.json();
        llenarFormulario(formato);
        
    } catch (error) {
        console.error('Error al cargar formato:', error);
        mostrarError(error.message);
    }
}

function llenarFormulario(formato) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('editarFormatoForm').style.display = 'block';

    // Llenar campos de texto
    document.getElementById('NOMB_CONTRI').value = formato.NOMB_CONTRI || '';
    document.getElementById('DIRECCION').value = formato.DIRECCION || '';
    document.getElementById('UBICACION_LOTE').value = formato.UBICACION_LOTE || '';
    document.getElementById('MEDIDA_TRAMITE').value = formato.MEDIDA_TRAMITE || '';
    document.getElementById('OTROS').value = formato.OTROS || '';

    // Limpiar checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);

    // Marcar tipos de trámite
    if (formato.TIPO_TRAMITE && Array.isArray(formato.TIPO_TRAMITE)) {
        formato.TIPO_TRAMITE.forEach(tipo => {
            const checkbox = document.getElementById(tipo);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
    }

    // Marcar documentos entregados
    if (formato.DOCUMENTOS_ENTREGADOS && Array.isArray(formato.DOCUMENTOS_ENTREGADOS)) {
        formato.DOCUMENTOS_ENTREGADOS.forEach(doc => {
            const checkbox = document.getElementById(doc);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
    }

    document.getElementById('editarFormatoForm').addEventListener('submit', actualizarFormato);
}

function mostrarError(mensaje) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error-message').style.display = 'block';
    document.getElementById('error-text').textContent = mensaje;
}

async function actualizarFormato(e) {
    e.preventDefault();
    
    const datos = {
        NOMB_CONTRI: document.getElementById('NOMB_CONTRI').value,
        DIRECCION: document.getElementById('DIRECCION').value,
        UBICACION_LOTE: document.getElementById('UBICACION_LOTE').value,
        MEDIDA_TRAMITE: document.getElementById('MEDIDA_TRAMITE').value,
        OTROS: document.getElementById('OTROS').value,
        TIPO_TRAMITE: [],
        DOCUMENTOS_ENTREGADOS: []
    };

    // Recopilar tipos de trámite seleccionados
    tiposTramiteIds.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox && checkbox.checked) {
            datos.TIPO_TRAMITE.push(id);
        }
    });

    // Recopilar documentos seleccionados
    documentosIds.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox && checkbox.checked) {
            datos.DOCUMENTOS_ENTREGADOS.push(id);
        }
    });

    datos.FECHA_ACTUALIZACION = new Date();

    try {
        mostrarMensaje('Actualizando formato...', 'success');
        
        const response = await fetch(`http://localhost:5000/formatos/${formatoId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datos)
        });
        
        if (response.ok) {
            mostrarMensaje('Formato actualizado correctamente', 'success');
            setTimeout(() => {
                window.location.href = `../panelFormatos.html`;
            }, 1500);
        } else {
            const error = await response.json();
            mostrarMensaje(`Error al actualizar: ${error.error}`, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error de conexión al actualizar formato', 'error');
    }
}

function mostrarMensaje(mensaje, tipo) {
    const messageDiv = document.getElementById('status-message');
    messageDiv.textContent = mensaje;
    messageDiv.className = `status-message status-${tipo}`;
    messageDiv.style.display = 'block';
    
    if (tipo === 'error') {
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
}