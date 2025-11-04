// agregarFicha.js - Lógica para agregar fichas de inspección

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

function mostrarMensaje(mensaje, tipo) {
    const messageDiv = document.getElementById('status-message');
    messageDiv.textContent = mensaje;
    messageDiv.className = `status-message status-${tipo}`;
    messageDiv.style.display = 'block';
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

function recopilarDatosFicha() {
    const form = document.getElementById('fichaForm');
    const formData = new FormData(form);
    const datos = {};

    for (let [key, value] of formData.entries()) {
        datos[key] = value;
    }

    // Recopilar conceptos seleccionados
    const conceptosSeleccionados = [];
    document.querySelectorAll('input[name="CONCEP"]:checked').forEach(cb => {
        const valorLegible = conceptosMap[cb.value] || cb.value;
        conceptosSeleccionados.push(valorLegible);
    });

    datos.CONCEPTOS = conceptosSeleccionados;
    datos.CONCEP = conceptosSeleccionados.join(', ') || 'Sin conceptos especificados';

    // Recopilar tipos de rectificación
    datos.FICHA_RECT_TIPO = [];
    document.querySelectorAll('input[name="FICHA_RECT_TIPO"]:checked').forEach(cb => {
        datos.FICHA_RECT_TIPO.push(cb.value);
    });

    // Fecha de actualización
    const hoy = new Date();
    const opcionesFecha = { year: 'numeric', month: 'long', day: 'numeric' };
    datos.FECHA_ACTU = hoy.toLocaleDateString('es-MX', opcionesFecha);

    return datos;
}

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
            return true;
        } else {
            const error = await response.json();
            console.error('Error al guardar ficha:', error);
            mostrarMensaje(`Error al guardar ficha: ${error.error}`, 'error');
            return false;
        }
    } catch (error) {
        console.error('Error al guardar ficha:', error);
        mostrarMensaje('Error de conexión al guardar ficha', 'error');
        return false;
    }
}

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
            return true;
        } else {
            const error = await response.json();
            mostrarMensaje(`Error: ${error.error}`, 'error');
            return false;
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error al generar la ficha', 'error');
        return false;
    }
}

async function guardarSoloFicha() {
    console.log('=== GUARDANDO SOLO FICHA ===');
    const datos = recopilarDatosFicha();
    console.log('Datos de ficha recopilados:', datos);
    
    const guardado = await guardarFicha(datos);
    
    if (guardado) {
        setTimeout(() => {
            window.location.href = '../panelFichas.html';
        }, 2000);
    }
}

// Event listener para el formulario
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('fichaForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('=== ENVIANDO FICHA DE INSPECCIÓN ===');
        const datos = recopilarDatosFicha();
        console.log('Datos de ficha recopilados:', datos);
        
        // Generar documento
        const generado = await generarFicha(datos);
        
        // Guardar en base de datos
        if (generado) {
            const guardado = await guardarFicha(datos);
            
            if (guardado) {
                setTimeout(() => {
                    window.location.href = '../panelFichas.html';
                }, 2000);
            }
        }
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

    console.log('Sistema de generación de fichas iniciado');
});