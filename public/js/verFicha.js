let fichaId = null;
let fichaData = null;
let cargaIniciada = false; // ← Bandera para evitar cargas duplicadas

document.addEventListener('DOMContentLoaded', function() {
    console.log('=== INICIANDO VER FICHA ===');
    console.log('URL completa:', window.location.href);
    console.log('Search params:', window.location.search);
    
    // Evitar carga duplicada
    if (cargaIniciada) {
        console.warn('⚠️ Carga ya iniciada, evitando duplicado');
        return;
    }
    cargaIniciada = true;
    
    const auth = verificarAutenticacion();
    if (!auth) {
        console.error('Usuario no autenticado');
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    fichaId = urlParams.get('id');
    
    console.log('ID extraído de URL:', fichaId);
    console.log('Tipo de ID:', typeof fichaId);
    console.log('ID es null?:', fichaId === null);
    console.log('ID es "null"?:', fichaId === 'null');
    
    // Validación estricta del ID
    if (!fichaId || fichaId === 'null' || fichaId === 'undefined' || fichaId.trim() === '') {
        console.error('❌ ID no válido:', fichaId);
        mostrarError('ID de ficha no válido o no proporcionado. Por favor, regrese e intente nuevamente.');
        return;
    }
    
    // Validar formato de ObjectId de MongoDB (24 caracteres hexadecimales)
    const objectIdRegex = /^[a-f\d]{24}$/i;
    if (!objectIdRegex.test(fichaId)) {
        console.error('❌ Formato de ID inválido:', fichaId);
        mostrarError(`El ID "${fichaId}" no tiene un formato válido de MongoDB ObjectId.`);
        return;
    }
    
    console.log('✅ ID válido, procediendo a cargar ficha');
    cargarFicha();
});

async function cargarFicha() {
    try {
        console.log('📡 Solicitando ficha con ID:', fichaId);
        console.log('URL de petición:', `http://localhost:5000/fichas/${fichaId}`);
        
        const response = await fetch(`http://localhost:5000/fichas/${fichaId}`);
        
        console.log('📥 Status de respuesta:', response.status);
        console.log('Status text:', response.statusText);
        
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

        fichaData = await response.json();
        console.log('✅ Datos de ficha recibidos:', fichaData);
        console.log('ID de ficha en datos:', fichaData._id);
        
        mostrarFicha(fichaData);
        
    } catch (error) {
        console.error('💥 Error al cargar ficha:', error);
        console.error('Stack trace:', error.stack);
        mostrarError(error.message);
    }
}

function mostrarFicha(ficha) {
    console.log('📋 Mostrando datos de ficha');
    
    document.getElementById('loading').style.display = 'none';
    document.getElementById('ficha-content').style.display = 'block';

    document.getElementById('NO_FICHI').textContent = ficha.NO_FICHI || '-';
    document.getElementById('LOTE_ACT').textContent = ficha.LOTE_ACT || '-';
    document.getElementById('MEDIDAS').textContent = ficha.MEDIDAS || '-';
    document.getElementById('INHU_CADA').textContent = ficha.INHU_CADA || '-';
    document.getElementById('FOLIO').textContent = ficha.FOLIO || '-';
    document.getElementById('HOJA').textContent = ficha.HOJA || '-';
    document.getElementById('ACTU_PROPIE').textContent = ficha.ACTU_PROPIE || '-';
    document.getElementById('TELEFONO').textContent = ficha.TELEFONO || '-';
    document.getElementById('CARAC_LOTE').textContent = ficha.CARAC_LOTE || '-';
    document.getElementById('SUR').textContent = ficha.SUR || '-';
    document.getElementById('NORTE').textContent = ficha.NORTE || '-';
    document.getElementById('OBSER').textContent = ficha.OBSER || '-';

    if (ficha.FECHA_INHU) {
        const fecha = new Date(ficha.FECHA_INHU);
        document.getElementById('FECHA_INHU').textContent = fecha.toLocaleDateString('es-MX');
    }

    const conceptosList = document.getElementById('conceptos-list');
    if (ficha.CONCEPTOS && ficha.CONCEPTOS.length > 0) {
        conceptosList.innerHTML = ficha.CONCEPTOS.map(concepto => 
            `<span class="concepto-badge">${concepto}</span>`
        ).join('');
    } else {
        conceptosList.innerHTML = '<span class="no-data">No hay conceptos registrados</span>';
    }

    if (ficha.FECHA_CREACION) {
        const fechaCreacion = new Date(ficha.FECHA_CREACION);
        document.getElementById('FECHA_CREACION').textContent = fechaCreacion.toLocaleString('es-MX');
    }

    if (ficha.FECHA_ACTUALIZACION) {
        const fechaActualizacion = new Date(ficha.FECHA_ACTUALIZACION);
        document.getElementById('FECHA_ACTUALIZACION').textContent = fechaActualizacion.toLocaleString('es-MX');
    }
    
    console.log('✅ Ficha mostrada correctamente');
}

function mostrarError(mensaje) {
    console.error('📛 Mostrando mensaje de error:', mensaje);
    
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error-message').style.display = 'block';
    document.getElementById('error-text').textContent = mensaje;
    
    // Agregar botón para volver
    const errorDiv = document.getElementById('error-message');
    if (!errorDiv.querySelector('.btn-secondary')) {
        const botonVolver = document.createElement('button');
        botonVolver.className = 'btn-secondary';
        botonVolver.textContent = 'Volver a Fichas';
        botonVolver.style.marginTop = '20px';
        botonVolver.onclick = () => window.history.back();
        errorDiv.appendChild(botonVolver);
    }
}

function editarFicha() {
    console.log('🔧 Navegando a editar ficha:', fichaId);
    
    if (fichaId) {
        window.location.href = `editarFicha.html?id=${fichaId}`;
    } else {
        alert('No se puede editar: ID de ficha no disponible');
    }
}

async function descargarFicha() {
    console.log('💾 Iniciando descarga de ficha');
    
    if (!fichaData) {
        alert('No hay datos de ficha para descargar');
        return;
    }

    try {
        const datosParaDocumento = { ...fichaData };
        if (datosParaDocumento.CONCEPTOS && Array.isArray(datosParaDocumento.CONCEPTOS)) {
            datosParaDocumento.CONCEP = datosParaDocumento.CONCEPTOS.join(', ');
        } else {
            datosParaDocumento.CONCEP = 'Sin conceptos especificados';
        }
        
        console.log('📄 Datos para generar documento:', datosParaDocumento);
        
        const response = await fetch('http://localhost:5000/generar-ficha', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datosParaDocumento)
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