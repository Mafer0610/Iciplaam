let fichaId = null;
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

        const ficha = await response.json();
        llenarFormulario(ficha);
        
    } catch (error) {
        console.error('Error al cargar ficha:', error);
        mostrarError(error.message);
    }
}

function llenarFormulario(ficha) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('editarFichaForm').style.display = 'block';

    document.getElementById('NO_FICHI').value = ficha.NO_FICHI || '';
    document.getElementById('LOTE_ACT').value = ficha.LOTE_ACT || '';
    document.getElementById('MEDIDAS').value = ficha.MEDIDAS || '';
    document.getElementById('INHU_CADA').value = ficha.INHU_CADA || '';
    document.getElementById('FOLIO').value = ficha.FOLIO || '';
    document.getElementById('HOJA').value = ficha.HOJA || '';
    document.getElementById('ACTU_PROPIE').value = ficha.ACTU_PROPIE || '';
    document.getElementById('TELEFONO').value = ficha.TELEFONO || '';
    document.getElementById('CARAC_LOTE').value = ficha.CARAC_LOTE || '';
    document.getElementById('SUR').value = ficha.SUR || '';
    document.getElementById('NORTE').value = ficha.NORTE || '';
    document.getElementById('OBSER').value = ficha.OBSER || '';

    if (ficha.FECHA_INHU) {
        const fecha = new Date(ficha.FECHA_INHU);
        const fechaFormateada = fecha.toISOString().split('T')[0];
        document.getElementById('FECHA_INHU').value = fechaFormateada;
    }

    if (ficha.CONCEPTOS && Array.isArray(ficha.CONCEPTOS)) {
        document.querySelectorAll('input[name="CONCEP"]').forEach(cb => cb.checked = false);
        
        ficha.CONCEPTOS.forEach(concepto => {
            const conceptoKey = Object.keys(conceptosMap).find(key => 
                conceptosMap[key] === concepto || key === concepto
            );
            
            if (conceptoKey) {
                const checkbox = document.querySelector(`input[name="CONCEP"][value="${conceptoKey}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            }
        });
    }

    document.getElementById('editarFichaForm').addEventListener('submit', actualizarFicha);
}

function mostrarError(mensaje) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error-message').style.display = 'block';
    document.getElementById('error-text').textContent = mensaje;
}

function toggleRectificacionFicha() {
    const checkbox = document.getElementById('CONC_RECTIFICACION');
    const options = document.getElementById('rectificacion-ficha-options');
    const subOptions = document.querySelectorAll('input[name="FICHA_RECT_TIPO"]');

    if (checkbox.checked) {
        options.style.display = 'block';
    } else {
        options.style.display = 'none';
        subOptions.forEach(cb => cb.checked = false);
    }
}

async function actualizarFicha(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const datos = {};

    for (let [key, value] of formData.entries()) {
        datos[key] = value;
    }

    datos.CONCEPTOS = [];
    document.querySelectorAll('input[name="CONCEP"]:checked').forEach(cb => {
        const valorLegible = conceptosMap[cb.value] || cb.value;
        datos.CONCEPTOS.push(valorLegible);
    });

    datos.FICHA_RECT_TIPO = [];
    document.querySelectorAll('input[name="FICHA_RECT_TIPO"]:checked').forEach(cb => {
        datos.FICHA_RECT_TIPO.push(cb.value);
    });

    datos.FECHA_ACTUALIZACION = new Date();

    try {
        mostrarMensaje('Actualizando ficha...', 'success');
        
        const response = await fetch(`http://localhost:5000/fichas/${fichaId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datos)
        });
        
        if (response.ok) {
            mostrarMensaje('Ficha actualizada correctamente', 'success');
            setTimeout(() => {
                window.location.href = `verFicha.html?id=${fichaId}`;
            }, 1500);
        } else {
            const error = await response.json();
            mostrarMensaje(`Error al actualizar: ${error.error}`, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error de conexión al actualizar ficha', 'error');
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