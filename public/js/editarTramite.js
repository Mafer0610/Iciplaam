let tramiteId = null;

function mostrarMensaje(mensaje, tipo) {
    const messageDiv = document.getElementById('status-message');
    messageDiv.textContent = mensaje;
    messageDiv.className = `status-message status-${tipo}`;
    messageDiv.style.display = 'block';
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

async function cargarDatosTramite() {
    const urlParams = new URLSearchParams(window.location.search);
    tramiteId = urlParams.get('id');

    if (!tramiteId) {
        mostrarMensaje('No se especificó un ID de trámite válido', 'error');
        setTimeout(() => {
            window.location.href = 'tramites.html';
        }, 2000);
        return;
    }

    try {
        console.log('Cargando datos del trámite:', tramiteId);
        
        const response = await fetchAutenticado(`http://localhost:5000/tramites/${tramiteId}`);
        
        if (!response.ok) {
            throw new Error('Error al obtener los datos del trámite');
        }

        const tramite = await response.json();
        console.log('Datos del trámite cargados:', tramite);
        
        llenarFormulario(tramite);
        
    } catch (error) {
        console.error('Error al cargar datos del trámite:', error);
        mostrarMensaje('Error al cargar los datos del trámite', 'error');
    }
}

function llenarFormulario(tramite) {
    // Llenar campos básicos
    const campos = ['FOLIO', 'TITULAR', 'RECIBO'];

    campos.forEach(campo => {
        const input = document.getElementById(campo);
        if (input && tramite[campo]) {
            input.value = tramite[campo];
        }
    });

    // Llenar fecha de elaboración
    if (tramite.FECHA_ELA) {
        const fecha = new Date(tramite.FECHA_ELA);
        const fechaFormateada = fecha.toISOString().split('T')[0];
        document.getElementById('FECHA_ELA').value = fechaFormateada;
    }

    // Configurar campos de costos y checkboxes
    const tiposCosto = [
        { checkbox: 'TIPO_INHUMACION', campos: ['INHUMACION', 'COSTO_INHU'], tipo: 'INHUMACION' },
        { checkbox: 'TIPO_EXHUMACION', campos: ['COSTO_EXHU'], tipo: 'EXHUMACION' },
        { checkbox: 'TIPO_REPOSICION', campos: ['REPOSICION'], tipo: 'REPOSICION' },
        { checkbox: 'TIPO_TRASPASO', campos: ['TRASPASO', 'COSTO_TRASPASO'], tipo: 'TRASPASO' },
        { checkbox: 'TIPO_CONSTRUCCION', campos: ['COSTO_CONSTRUCCION'], tipo: 'CONSTRUCCION' },
        { checkbox: 'TIPO_MANTENIMIENTO', campos: ['COSTO_MANTENIMIENTO'], tipo: 'MANTENIMIENTO' },
        { checkbox: 'TIPO_LOTE', campos: ['COSTO_LOTE'], tipo: 'LOTE' },
        { checkbox: 'TIPO_AMPL_CM', campos: ['COSTO_AMPL_CM'], tipo: 'AMPL_CM' },
        { checkbox: 'TIPO_REGULARIZACION', campos: ['COSTO_REGULARIZACION'], tipo: 'REGULARIZACION' },
        { checkbox: 'TIPO_BUSQUEDA', campos: ['COSTO_BUSQUEDA'], tipo: 'BUSQUEDA' }
    ];

    tiposCosto.forEach(item => {
        const checkbox = document.getElementById(item.checkbox);
        let tieneValor = false;
        
        // Verificar si alguno de los campos de este tipo tiene valor
        item.campos.forEach(campo => {
            if (tramite[campo] && tramite[campo].trim() !== '') {
                tieneValor = true;
                const input = document.getElementById(campo);
                if (input) {
                    input.value = tramite[campo];
                }
            }
        });
        
        // Si tiene valor, marcar el checkbox y mostrar los campos
        if (tieneValor && checkbox) {
            checkbox.checked = true;
            toggleTramiteField(item.tipo);
        }
    });
}

function recopilarDatosTramite() {
    const form = document.getElementById('editarTramiteForm');
    const formData = new FormData(form);
    const datos = {};

    // Recopilar datos básicos del formulario (solo campos principales)
    const camposPrincipales = ['FECHA_ELA', 'FOLIO', 'TITULAR', 'RECIBO'];
    camposPrincipales.forEach(campo => {
        const input = document.getElementById(campo);
        if (input) {
            datos[campo] = input.value || '';
        }
    });

    // Procesar campos de trámites - solo incluir si el checkbox está marcado
    const tiposTramite = [
        { checkbox: 'TIPO_INHUMACION', campos: ['INHUMACION', 'COSTO_INHU'] },
        { checkbox: 'TIPO_EXHUMACION', campos: ['COSTO_EXHU'] },
        { checkbox: 'TIPO_REPOSICION', campos: ['REPOSICION'] },
        { checkbox: 'TIPO_TRASPASO', campos: ['TRASPASO', 'COSTO_TRASPASO'] },
        { checkbox: 'TIPO_CONSTRUCCION', campos: ['COSTO_CONSTRUCCION'] },
        { checkbox: 'TIPO_MANTENIMIENTO', campos: ['COSTO_MANTENIMIENTO'] },
        { checkbox: 'TIPO_LOTE', campos: ['COSTO_LOTE'] },
        { checkbox: 'TIPO_AMPL_CM', campos: ['COSTO_AMPL_CM'] },
        { checkbox: 'TIPO_REGULARIZACION', campos: ['COSTO_REGULARIZACION'] },
        { checkbox: 'TIPO_BUSQUEDA', campos: ['COSTO_BUSQUEDA'] }
    ];

    // Inicializar todos los campos como vacíos
    const todosCampos = [
        'INHUMACION', 'COSTO_INHU', 'COSTO_EXHU', 'REPOSICION', 'TRASPASO', 'COSTO_TRASPASO',
        'COSTO_CONSTRUCCION', 'COSTO_MANTENIMIENTO', 'COSTO_LOTE', 'COSTO_AMPL_CM', 
        'COSTO_REGULARIZACION', 'COSTO_BUSQUEDA'
    ];
    
    todosCampos.forEach(campo => {
        datos[campo] = '';
    });

    // Llenar solo los campos de trámites seleccionados
    tiposTramite.forEach(item => {
        const checkbox = document.getElementById(item.checkbox);
        
        if (checkbox && checkbox.checked) {
            item.campos.forEach(campo => {
                const input = document.getElementById(campo);
                if (input && !input.disabled) {
                    datos[campo] = input.value || '';
                }
            });
        }
    });

    console.log('Datos del trámite recopilados para actualización:', datos);
    return datos;
}

function validarFormulario() {
    const camposRequeridos = ['FECHA_ELA', 'FOLIO', 'TITULAR'];
    let valido = true;
    let mensajeError = '';

    camposRequeridos.forEach(campo => {
        const input = document.getElementById(campo);
        if (!input.value.trim()) {
            valido = false;
            mensajeError += `El campo ${input.previousElementSibling.textContent} es requerido.\n`;
            input.style.borderColor = '#e74c3c';
        } else {
            input.style.borderColor = '#27ae60';
        }
    });

    // Validar que el folio no esté vacío y tenga formato válido
    const folio = document.getElementById('FOLIO').value.trim();
    if (folio && !/^[A-Za-z0-9\-_]+$/.test(folio)) {
        valido = false;
        mensajeError += 'El folio debe contener solo letras, números, guiones y guiones bajos.\n';
        document.getElementById('FOLIO').style.borderColor = '#e74c3c';
    }

    if (!valido) {
        mostrarMensaje(mensajeError, 'error');
    }

    return valido;
}

async function actualizarTramite(datos) {
    try {
        console.log('Actualizando trámite:', tramiteId, datos);
        
        const response = await fetchAutenticado(`http://localhost:5000/tramites/${tramiteId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datos)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al actualizar el trámite');
        }

        const result = await response.json();
        console.log('Trámite actualizado exitosamente:', result);
        
        mostrarMensaje('Trámite actualizado correctamente', 'success');
        
        // Redirigir después de 2 segundos
        setTimeout(() => {
            window.location.href = 'tramites.html';
        }, 2000);

    } catch (error) {
        console.error('Error al actualizar trámite:', error);
        mostrarMensaje(`Error al actualizar trámite: ${error.message}`, 'error');
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Cargar datos del trámite
    cargarDatosTramite();
    
    const form = document.getElementById('editarTramiteForm');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        console.log('=== ACTUALIZANDO TRÁMITE ===');
        
        if (!validarFormulario()) {
            return;
        }
        
        const datos = recopilarDatosTramite();
        actualizarTramite(datos);
    });

    // Validación en tiempo real para campos requeridos
    const camposRequeridos = ['FECHA_ELA', 'FOLIO', 'TITULAR'];
    camposRequeridos.forEach(campo => {
        const input = document.getElementById(campo);
        if (input) {
            input.addEventListener('blur', function() {
                if (this.value.trim() === '') {
                    this.style.borderColor = '#e74c3c';
                } else {
                    this.style.borderColor = '#27ae60';
                }
            });
        }
    });

    // Formatear campos de dinero mientras se escribe
    const camposDinero = [
        'COSTO_INHU', 'COSTO_EXHU', 'REPOSICION', 'COSTO_TRASPASO',
        'COSTO_CONSTRUCCION', 'COSTO_MANTENIMIENTO', 'COSTO_LOTE', 'COSTO_AMPL_CM',
        'COSTO_REGULARIZACION', 'COSTO_BUSQUEDA'
    ];
    
    camposDinero.forEach(campo => {
        const input = document.getElementById(campo);
        if (input) {
            input.addEventListener('input', function() {
                let value = this.value.replace(/[^\d.]/g, '');
                
                // Permitir solo un punto decimal
                const parts = value.split('.');
                if (parts.length > 2) {
                    value = parts[0] + '.' + parts.slice(1).join('');
                }
                
                // Limitar a 2 decimales
                if (parts[1] && parts[1].length > 2) {
                    value = parts[0] + '.' + parts[1].substring(0, 2);
                }
                
                this.value = value;
            });
            
            input.addEventListener('blur', function() {
                if (this.value && !this.value.startsWith('$')) {
                    this.value = '$' + this.value;
                }
            });
        }
    });

    console.log('Sistema de edición de trámites iniciado');
});