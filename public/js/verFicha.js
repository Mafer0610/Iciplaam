let fichaId = null;
let fichaData = null;

document.addEventListener('DOMContentLoaded', function() {
    const auth = verificarAutenticacion();
    if (!auth) return;

    const urlParams = new URLSearchParams(window.location.search);
    fichaId = urlParams.get('id');
    
    if (!fichaId) {
        mostrarError('ID de ficha no proporcionado');
        return;
    }

    cargarFicha();
});

async function cargarFicha() {
    try {
        const response = await fetch(`http://localhost:5000/fichas/${fichaId}`);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        fichaData = await response.json();
        mostrarFicha(fichaData);
        
    } catch (error) {
        console.error('Error al cargar ficha:', error);
        mostrarError(error.message);
    }
}

function mostrarFicha(ficha) {
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
}

function mostrarError(mensaje) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error-message').style.display = 'block';
    document.getElementById('error-text').textContent = mensaje;
}

function editarFicha() {
    if (fichaId) {
        window.location.href = `editarFicha.html?id=${fichaId}`;
    }
}

async function descargarFicha() {
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
        
        console.log('Datos para generar documento:', datosParaDocumento);
        
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
        } else {
            const error = await response.json();
            alert(`Error al generar documento: ${error.error}`);
        }
    } catch (error) {
        console.error('Error al descargar:', error);
        alert('Error al descargar el documento');
    }
}