let formatoId = null;
let formatoData = null;

// Mapeo de nombres de documentos
const documentosMap = {
    'BOLETA_PROPIEDAD': 'Boleta de Propiedad',
    'PAGO_MANTENIMIENTO': 'Pago de Mantenimiento',
    'INE_PROPIETARIO': 'INE Propietario',
    'PARIENTE': 'Pariente',
    'TESTIGOS': 'Testigos',
    'NVO_PROPIETARIO': 'Nuevo Propietario',
    'ACTA_DEFUNCION': 'Acta de Defunción',
    'INHUMADO': 'Inhumado',
    'PROPIETARIO_EXHUMADO': 'Propietario Exhumado',
    'ORDEN_INHUMACION': 'Orden de Inhumación',
    'OFICIO_SOLICITUD': 'Oficio de Solicitud',
    'ACTA_NACIMIENTO': 'Acta de Nacimiento',
    'ACTA_MATRIMONIO': 'Acta de Matrimonio',
    'CARTA_PODER': 'Carta Poder',
    'FOTO_LOTE': 'Foto del Lote',
    'CARTA_RESPONSIVA': 'Carta Responsiva',
    'CONSTRUCCION_CARTA': 'Construcción (Carta)',
    'EXHUMACION_CARTA': 'Exhumación (Carta)',
    'TRASPASO_CARTA': 'Traspaso (Carta)',
    'OTROS_CHECK': 'Otros'
};

// Mapeo de tipos de trámite
const tipoTramiteMap = {
    'INHUMACION': 'Inhumación',
    'REP_BOLETA': 'Reposición de Boleta',
    'TRASP_LOTE': 'Traspaso de Lote',
    'TRASPA_SISTEMA': 'Alta en el Sistema',
    'CONSTRUC_GAVETA': 'Construcción de Gaveta',
    'CONSTRUC_DEPOSITO': 'Depósito de Cenizas',
    'EXHUMA_CENIZAS': 'Exhumación de Cenizas'
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('=== INICIANDO VER FORMATO ===');
    
    const auth = verificarAutenticacion();
    if (!auth) {
        console.error('Usuario no autenticado');
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    formatoId = urlParams.get('id');
    
    console.log('ID extraído de URL:', formatoId);
    
    if (!formatoId || formatoId === 'null' || formatoId === 'undefined' || formatoId.trim() === '') {
        console.error('❌ ID no válido:', formatoId);
        mostrarError('ID de formato no válido o no proporcionado.');
        return;
    }
    
    const objectIdRegex = /^[a-f\d]{24}$/i;
    if (!objectIdRegex.test(formatoId)) {
        console.error('❌ Formato de ID inválido:', formatoId);
        mostrarError(`El ID "${formatoId}" no tiene un formato válido.`);
        return;
    }
    
    console.log('✅ ID válido, procediendo a cargar formato');
    cargarFormato();
});

async function cargarFormato() {
    try {
        console.log('📡 Solicitando formato con ID:', formatoId);
        
        const response = await fetch(`http://localhost:5000/formatos/${formatoId}`);
        
        console.log('📥 Status de respuesta:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error del servidor:', errorText);
            
            let errorMessage = `Error ${response.status}: ${response.statusText}`;
            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.error) {
                    errorMessage = errorJson.error;
                }
            } catch (e) {
                // Si no es JSON, usar el texto tal cual
            }
            
            throw new Error(errorMessage);
        }

        formatoData = await response.json();
        console.log('✅ Datos de formato recibidos:', formatoData);
        
        mostrarFormato(formatoData);
        
    } catch (error) {
        console.error('💥 Error al cargar formato:', error);
        mostrarError(error.message);
    }
}

function mostrarFormato(formato) {
    console.log('📋 Mostrando datos de formato');
    
    document.getElementById('loading').style.display = 'none';
    document.getElementById('formato-content').style.display = 'block';

    // Información del contribuyente
    document.getElementById('NOMB_CONTRI').textContent = formato.NOMB_CONTRI || '-';
    document.getElementById('DIRECCION').textContent = formato.DIRECCION || '-';
    document.getElementById('UBICACION_LOTE').textContent = formato.UBICACION_LOTE || '-';
    document.getElementById('MEDIDA_TRAMITE').textContent = formato.MEDIDA_TRAMITE || '-';

    // Tipos de trámite
    const tipoTramiteList = document.getElementById('tipo-tramite-list');
    if (formato.TIPO_TRAMITE && formato.TIPO_TRAMITE.length > 0) {
        tipoTramiteList.innerHTML = formato.TIPO_TRAMITE.map(tipo => {
            const nombreLegible = tipoTramiteMap[tipo] || tipo;
            return `<span class="tramite-badge">${nombreLegible}</span>`;
        }).join('');
    } else {
        tipoTramiteList.innerHTML = '<span class="no-data">No hay tipos de trámite registrados</span>';
    }

    // Documentos entregados
    const documentosList = document.getElementById('documentos-list');
    if (formato.DOCUMENTOS_ENTREGADOS && formato.DOCUMENTOS_ENTREGADOS.length > 0) {
        documentosList.innerHTML = formato.DOCUMENTOS_ENTREGADOS.map(doc => {
            const nombreLegible = documentosMap[doc] || doc;
            return `<span class="documento-badge">${nombreLegible}</span>`;
        }).join('');
    } else {
        documentosList.innerHTML = '<span class="no-data">No hay documentos registrados</span>';
    }

    // Otros
    document.getElementById('OTROS').textContent = formato.OTROS || 'Ninguno';

    // Fechas
    if (formato.FECHA_CREACION) {
        const fechaCreacion = new Date(formato.FECHA_CREACION);
        document.getElementById('FECHA_CREACION').textContent = fechaCreacion.toLocaleString('es-MX');
    }

    if (formato.FECHA_ACTUALIZACION) {
        const fechaActualizacion = new Date(formato.FECHA_ACTUALIZACION);
        document.getElementById('FECHA_ACTUALIZACION').textContent = fechaActualizacion.toLocaleString('es-MX');
    }

    // Estado
    const estadoElement = document.getElementById('ESTADO');
    const estado = formato.ESTADO || 'COMPLETO';
    estadoElement.textContent = estado;
    estadoElement.style.color = estado === 'COMPLETO' ? '#28a745' : '#ffc107';
    estadoElement.style.fontWeight = 'bold';
    
    console.log('✅ Formato mostrado correctamente');
}

function mostrarError(mensaje) {
    console.error('📛 Mostrando mensaje de error:', mensaje);
    
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error-message').style.display = 'block';
    document.getElementById('error-text').textContent = mensaje;
    
    const errorDiv = document.getElementById('error-message');
    if (!errorDiv.querySelector('.btn-secondary')) {
        const botonVolver = document.createElement('button');
        botonVolver.className = 'btn-secondary';
        botonVolver.textContent = 'Volver a Formatos';
        botonVolver.style.marginTop = '20px';
        botonVolver.onclick = () => window.history.back();
        errorDiv.appendChild(botonVolver);
    }
}

function editarFormato() {
    console.log('🔧 Navegando a editar formato:', formatoId);
    
    if (formatoId) {
        window.location.href = `editarFormato.html?id=${formatoId}`;
    } else {
        alert('No se puede editar: ID de formato no disponible');
    }
}

async function descargarFormato() {
    console.log('💾 Iniciando descarga de formato');
    
    if (!formatoData) {
        alert('No hay datos de formato para descargar');
        return;
    }

    try {
        console.log('📄 Datos para generar documento:', formatoData);
        
        const response = await fetch('http://localhost:5000/generar-tramite', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formatoData)
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Formato_Control_${formatoData.NOMB_CONTRI || 'Sin_Nombre'}_${new Date().toISOString().split('T')[0]}.docx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            console.log('✅ Descarga iniciada correctamente');
        } else {
            const error = await response.json();
            console.error('❌ Error al generar documento:', error);
            alert(`Error al generar documento: ${error.error}`);
        }
    } catch (error) {
        console.error('💥 Error al descargar:', error);
        alert('Error al descargar el documento');
    }
}