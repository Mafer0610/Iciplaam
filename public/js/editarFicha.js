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

    // Campos básicos
    document.getElementById('NO_FICHI').value   = ficha.NO_FICHI   || '';
    document.getElementById('LOTE_ACT').value   = ficha.LOTE_ACT   || '';
    document.getElementById('MEDIDAS').value    = ficha.MEDIDAS    || '';
    document.getElementById('INHU_CADA').value  = ficha.INHU_CADA  || '';
    document.getElementById('FOLIO').value      = ficha.FOLIO      || '';
    document.getElementById('HOJA').value       = ficha.HOJA       || '';
    document.getElementById('ACTU_PROPIE').value= ficha.ACTU_PROPIE|| '';
    document.getElementById('TELEFONO').value   = ficha.TELEFONO   || '';
    document.getElementById('CARAC_LOTE').value = ficha.CARAC_LOTE || '';
    document.getElementById('SUR').value        = ficha.SUR        || '';
    document.getElementById('NORTE').value      = ficha.NORTE      || '';
    document.getElementById('OBSER').value      = ficha.OBSER      || '';

    // Fecha de inhumación
    if (ficha.FECHA_INHU) {
        const fecha = new Date(ficha.FECHA_INHU);
        document.getElementById('FECHA_INHU').value = fecha.toISOString().split('T')[0];
    }

    // Fecha manual de la ficha
    if (ficha.FECHA_FICHA) {
        const fechaFicha = new Date(ficha.FECHA_FICHA);
        document.getElementById('FECHA_FICHA').value = fechaFicha.toISOString().split('T')[0];
    }

    // Conceptos
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

        // Mostrar campos extra si los conceptos están marcados
        const inhumacionCb = document.getElementById('CONC_INHUMACION');
        if (inhumacionCb && inhumacionCb.checked) {
            document.getElementById('inhumacion-fields').style.display = 'block';
            document.getElementById('NOMBRE_INHUMADO').value = ficha.NOMBRE_INHUMADO || '';
        }

        // Reposición de boleta
        const repBoletaCb = document.getElementById('CONC_REP_BOLETA');
        if (repBoletaCb && repBoletaCb.checked) {
            document.getElementById('rep-boleta-fields').style.display = 'block';
            if (ficha.RAZON_BOLETA) {
                const radio = document.querySelector(`input[name="RAZON_BOLETA"][value="${ficha.RAZON_BOLETA}"]`);
                if (radio) {
                    radio.checked = true;
                    if (ficha.RAZON_BOLETA === 'ACTUALIZACION_DATOS') {
                        document.getElementById('actualizacion-options').style.display = 'block';
                        if (ficha.TIPO_ACTUALIZACION && Array.isArray(ficha.TIPO_ACTUALIZACION)) {
                            ficha.TIPO_ACTUALIZACION.forEach(tipo => {
                                const cb = document.querySelector(`input[name="TIPO_ACTUALIZACION"][value="${tipo}"]`);
                                if (cb) {
                                    cb.checked = true;
                                    const detalle = document.getElementById('detalle-' + tipo);
                                    if (detalle) {
                                        detalle.style.display = 'block';
                                        const input = detalle.querySelector('input[type="text"]');
                                        if (input && ficha.DETALLES_ACTUALIZACION) {
                                            input.value = ficha.DETALLES_ACTUALIZACION[tipo] || '';
                                        }
                                    }
                                }
                            });
                        }
                    }
                }
            }
        }

        const traspasoCb = document.getElementById('CONC_TRASP_LOTE');
        if (traspasoCb && traspasoCb.checked) {
            document.getElementById('traspaso-fields').style.display = 'block';
            // Tipo de traspaso
            if (ficha.TIPO_TRASPASO) {
                const radio = document.querySelector(`input[name="TIPO_TRASPASO"][value="${ficha.TIPO_TRASPASO}"]`);
                if (radio) radio.checked = true;
            }
            document.getElementById('NOMBRE_CEDENTE').value  = ficha.NOMBRE_CEDENTE  || '';
            document.getElementById('NOMBRE_RECEPTOR').value = ficha.NOMBRE_RECEPTOR || '';
        }

        // Exhumación: cargar personas guardadas
        const exhumaCb = document.getElementById('CONC_EXHUMA_CENIZAS');
        if (exhumaCb && exhumaCb.checked && ficha.PERSONAS_EXHUMACION && ficha.PERSONAS_EXHUMACION.length > 0) {
            document.getElementById('exhumacion-fields').style.display = 'block';
            ficha.PERSONAS_EXHUMACION.forEach(p => {
                const fecha = p.fecha_inhumacion ? p.fecha_inhumacion.split('T')[0] : '';
                agregarPersonaExhumacion(p.nombre || '', fecha);
            });
        } else if (exhumaCb && exhumaCb.checked) {
            document.getElementById('exhumacion-fields').style.display = 'block';
            agregarPersonaExhumacion();
        }

        // Depósito de cenizas: cargar personas guardadas
        const depositoCb = document.getElementById('CONC_CONSTRUC_DEPOSITO');
        if (depositoCb && depositoCb.checked && ficha.PERSONAS_DEPOSITO && ficha.PERSONAS_DEPOSITO.length > 0) {
            document.getElementById('deposito-fields').style.display = 'block';
            ficha.PERSONAS_DEPOSITO.forEach(p => {
                const fecha = p.fecha_defuncion ? p.fecha_defuncion.split('T')[0] : '';
                agregarPersonaDeposito(p.nombre || '', fecha);
            });
        } else if (depositoCb && depositoCb.checked) {
            document.getElementById('deposito-fields').style.display = 'block';
            agregarPersonaDeposito();
        }
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

    // Conceptos
    datos.CONCEPTOS = [];
    document.querySelectorAll('input[name="CONCEP"]:checked').forEach(cb => {
        const valorLegible = conceptosMap[cb.value] || cb.value;
        datos.CONCEPTOS.push(valorLegible);
    });

    // Rectificaciones
    datos.FICHA_RECT_TIPO = [];
    document.querySelectorAll('input[name="FICHA_RECT_TIPO"]:checked').forEach(cb => {
        datos.FICHA_RECT_TIPO.push(cb.value);
    });

    // ── NUEVO: exhumación (múltiples personas) ─────────────────────────────
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

    // ── NUEVO: depósito de cenizas (múltiples personas) ────────────────────
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

    // ── NUEVO: reposición de boleta ────────────────────────────────────────
    const repBoletaChecked = document.getElementById('CONC_REP_BOLETA')?.checked;
    if (repBoletaChecked) {
        const razonEl = document.querySelector('input[name="RAZON_BOLETA"]:checked');
        datos.RAZON_BOLETA = razonEl ? razonEl.value : '';
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

    // ── NUEVO: inhumación ──────────────────────────────────────────────────
    const inhumacionChecked = document.getElementById('CONC_INHUMACION')?.checked;
    datos.NOMBRE_INHUMADO = inhumacionChecked
        ? (document.getElementById('NOMBRE_INHUMADO')?.value?.trim() || '')
        : '';

    // ── NUEVO: traspaso ────────────────────────────────────────────────────
    const traspasoChecked = document.getElementById('CONC_TRASP_LOTE')?.checked;
    if (traspasoChecked) {
        const tipoTraspasoEl = document.querySelector('input[name="TIPO_TRASPASO"]:checked');
        datos.TIPO_TRASPASO   = tipoTraspasoEl ? tipoTraspasoEl.value : '';
        datos.NOMBRE_CEDENTE  = document.getElementById('NOMBRE_CEDENTE')?.value?.trim()  || '';
        datos.NOMBRE_RECEPTOR = document.getElementById('NOMBRE_RECEPTOR')?.value?.trim() || '';
    } else {
        datos.TIPO_TRASPASO   = '';
        datos.NOMBRE_CEDENTE  = '';
        datos.NOMBRE_RECEPTOR = '';
    }

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
                window.location.href = `../panelFichas.html?id=${fichaId}`;
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