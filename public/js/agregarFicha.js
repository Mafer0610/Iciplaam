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

    // ── NUEVO: datos de exhumación (múltiples personas) ────────────────────
    const exhumacionChecked = document.getElementById('CONC_EXHUMA_CENIZAS')?.checked;
    if (exhumacionChecked) {
        datos.PERSONAS_EXHUMACION = [];
        const personas = document.querySelectorAll('#exhumacion-personas-list > div[id^="exhumacion-persona-"]');
        personas.forEach(div => {
            const idx = div.id.split('-').pop();
            const nombre = div.querySelector(`[name="EXHUMA_NOMBRE_${idx}"]`)?.value?.trim() || '';
            const fecha  = div.querySelector(`[name="EXHUMA_FECHA_INHU_${idx}"]`)?.value || '';
            if (nombre || fecha) datos.PERSONAS_EXHUMACION.push({ nombre, fecha_inhumacion: fecha });
        });
    } else {
        datos.PERSONAS_EXHUMACION = [];
    }

    // ── NUEVO: datos de depósito de cenizas (múltiples personas) ───────────
    const depositoChecked = document.getElementById('CONC_CONSTRUC_DEPOSITO')?.checked;
    if (depositoChecked) {
        datos.PERSONAS_DEPOSITO = [];
        const personas = document.querySelectorAll('#deposito-personas-list > div[id^="deposito-persona-"]');
        personas.forEach(div => {
            const idx = div.id.split('-').pop();
            const nombre = div.querySelector(`[name="DEPOSITO_NOMBRE_${idx}"]`)?.value?.trim() || '';
            const fecha  = div.querySelector(`[name="DEPOSITO_FECHA_DEF_${idx}"]`)?.value || '';
            if (nombre || fecha) datos.PERSONAS_DEPOSITO.push({ nombre, fecha_defuncion: fecha });
        });
    } else {
        datos.PERSONAS_DEPOSITO = [];
    }

    // ── NUEVO: datos de reposición de boleta ────────────────────────────────
    const repBoletaChecked = document.getElementById('CONC_REP_BOLETA')?.checked;
    if (repBoletaChecked) {
        const razonEl = document.querySelector('input[name="RAZON_BOLETA"]:checked');
        datos.RAZON_BOLETA = razonEl ? razonEl.value : '';
        // Tipos de actualización seleccionados y sus detalles
        datos.TIPO_ACTUALIZACION = [];
        datos.DETALLES_ACTUALIZACION = {};
        document.querySelectorAll('input[name="TIPO_ACTUALIZACION"]:checked').forEach(cb => {
            datos.TIPO_ACTUALIZACION.push(cb.value);
            const detalle = document.querySelector(`input[name="DETALLE_${cb.value.replace('_BOLETA', '')}"]`)
                         || document.querySelector(`[name="DETALLE_${cb.value}"]`);
            datos.DETALLES_ACTUALIZACION[cb.value] = detalle ? detalle.value.trim() : '';
        });
    } else {
        datos.RAZON_BOLETA = '';
        datos.TIPO_ACTUALIZACION = [];
        datos.DETALLES_ACTUALIZACION = {};
    }

    // ── NUEVO: datos de inhumación ──────────────────────────────────────────
    const inhumacionChecked = document.getElementById('CONC_INHUMACION')?.checked;
    if (inhumacionChecked) {
        datos.NOMBRE_INHUMADO = document.getElementById('NOMBRE_INHUMADO')?.value?.trim() || '';
    } else {
        datos.NOMBRE_INHUMADO = '';
    }

    // ── NUEVO: datos de traspaso ────────────────────────────────────────────
    const traspasoChecked = document.getElementById('CONC_TRASP_LOTE')?.checked;
    if (traspasoChecked) {
        const tipoTraspasoEl = document.querySelector('input[name="TIPO_TRASPASO"]:checked');
        datos.TIPO_TRASPASO = tipoTraspasoEl ? tipoTraspasoEl.value : '';
        datos.NOMBRE_CEDENTE  = document.getElementById('NOMBRE_CEDENTE')?.value?.trim()  || '';
        datos.NOMBRE_RECEPTOR = document.getElementById('NOMBRE_RECEPTOR')?.value?.trim() || '';
    } else {
        datos.TIPO_TRASPASO   = '';
        datos.NOMBRE_CEDENTE  = '';
        datos.NOMBRE_RECEPTOR = '';
    }

    // ── NUEVO: fecha manual de la ficha ────────────────────────────────────
    // FECHA_FICHA ya viene en formData, pero la aseguramos por si acaso
    if (!datos.FECHA_FICHA) {
        datos.FECHA_FICHA = '';
    }

    // Fecha de actualización para la plantilla Word (legible)
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