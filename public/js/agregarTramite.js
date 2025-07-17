function mostrarMensaje(mensaje, tipo) {
    const messageDiv = document.getElementById('status-message');
    messageDiv.textContent = mensaje;
    messageDiv.className = `status-message status-${tipo}`;
    messageDiv.style.display = 'block';
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

function recopilarDatosTramite() {
    const form = document.getElementById('tramiteForm');
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

    console.log('Datos del trámite recopilados:', datos);
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

    // Validar que al menos un tipo de trámite esté seleccionado
    const tiposSeleccionados = document.querySelectorAll('input[id^="TIPO_"]:checked');
    if (tiposSeleccionados.length === 0) {
        valido = false;
        mensajeError += 'Debe seleccionar al menos un tipo de trámite.\n';
    }

    if (!valido) {
        mostrarMensaje(mensajeError, 'error');
    }

    return valido;
}

async function guardarTramite(datos) {
    try {
        console.log('Enviando trámite a la base de datos:', datos);
        
        const response = await fetchAutenticado('http://localhost:5000/tramites', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datos)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al guardar el trámite');
        }

        const result = await response.json();
        console.log('Trámite guardado exitosamente:', result);
        
        mostrarMensaje('Trámite guardado correctamente', 'success');
        
        // Limpiar formulario después de guardar
        setTimeout(() => {
            document.getElementById('tramiteForm').reset();
            limpiarFormulario();
        }, 1000);
        
        // Redirigir después de 2 segundos
        setTimeout(() => {
            window.location.href = 'tramites.html';
        }, 2000);

    } catch (error) {
        console.error('Error al guardar trámite:', error);
        mostrarMensaje(`Error al guardar trámite: ${error.message}`, 'error');
    }
}

// Event listener para el formulario
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('tramiteForm');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        console.log('=== ENVIANDO TRÁMITE ===');
        
        if (!validarFormulario()) {
            return;
        }
        
        const datos = recopilarDatosTramite();
        guardarTramite(datos);
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

    console.log('Sistema de trámites iniciado');
});