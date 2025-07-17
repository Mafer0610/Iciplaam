let tramiteActual = null;

function mostrarMensaje(mensaje, tipo) {
    const messageDiv = document.getElementById('status-message');
    messageDiv.textContent = mensaje;
    messageDiv.className = `status-message status-${tipo}`;
    messageDiv.style.display = 'block';
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

function mostrarError(mensaje) {
    const errorContainer = document.getElementById('error-container');
    errorContainer.innerHTML = `<div class="error">${mensaje}</div>`;
    errorContainer.style.display = 'block';
    
    document.getElementById('loading').style.display = 'none';
    document.getElementById('tramite-container').style.display = 'none';
}

function ocultarCarga() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error-container').style.display = 'none';
    document.getElementById('tramite-container').style.display = 'block';
}

function mostrarValor(elementId, valor, esVacio = false) {
    const elemento = document.getElementById(elementId);
    if (elemento) {
        if (!valor || valor.trim() === '') {
            elemento.textContent = esVacio ? 'No especificado' : '-';
            elemento.classList.add('empty');
        } else {
            elemento.textContent = valor;
            elemento.classList.remove('empty');
        }
    }
}

function formatearFecha(fecha) {
    if (!fecha) return 'No especificada';
    
    try {
        const fechaObj = new Date(fecha);
        return fechaObj.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return 'Fecha inválida';
    }
}

function mostrarCostos(tramite) {
    const costosGrid = document.getElementById('costos-grid');
    const costosContainer = document.getElementById('costos-container');
    
    // Definir todos los posibles costos
    const costos = [
        { campo: 'COSTO_INHU', label: 'Costo de Inhumación' },
        { campo: 'COSTO_EXHU', label: 'Costo de Exhumación' },
        { campo: 'REPOSICION', label: 'Reposición de Constancia' },
        { campo: 'COSTO_TRASPASO', label: 'Costo del Traspaso' },
        { campo: 'COSTO_CONSTRUCCION', label: 'Costo de Construcción' },
        { campo: 'COSTO_MANTENIMIENTO', label: 'Costo de Mantenimiento' },
        { campo: 'COSTO_REGULARIZACION', label: 'Costo de Regularización' },
        { campo: 'COSTO_BUSQUEDA', label: 'Costo de Búsqueda' }
    ];
    
    // Filtrar solo los costos que tienen valor
    const costosConValor = costos.filter(costo => 
        tramite[costo.campo] && tramite[costo.campo].trim() !== ''
    );
    
    if (costosConValor.length === 0) {
        costosContainer.style.display = 'none';
        return;
    }
    
    // Limpiar grid de costos
    costosGrid.innerHTML = '';
    
    // Agregar cada costo
    costosConValor.forEach(costo => {
        const costoDiv = document.createElement('div');
        costoDiv.className = 'info-item cost-item';
        costoDiv.innerHTML = `
            <div class="info-label">${costo.label}</div>
            <div class="info-value">${tramite[costo.campo]}</div>
        `;
        costosGrid.appendChild(costoDiv);
    });
    
    costosContainer.style.display = 'block';
}

async function cargarDatosTramite() {
    const urlParams = new URLSearchParams(window.location.search);
    const tramiteId = urlParams.get('id');

    if (!tramiteId) {
        mostrarError('No se especificó un ID de trámite válido');
        return;
    }

    try {
        console.log('Cargando datos del trámite:', tramiteId);
        
        const response = await fetchAutenticado(`http://localhost:5000/tramites/${tramiteId}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Trámite no encontrado');
            }
            throw new Error(`Error del servidor: ${response.status}`);
        }

        const tramite = await response.json();
        console.log('Datos del trámite cargados:', tramite);
        
        tramiteActual = tramite;
        mostrarDatosTramite(tramite);
        
    } catch (error) {
        console.error('Error al cargar datos del trámite:', error);
        mostrarError(`Error al cargar los datos: ${error.message}`);
    }
}

function mostrarDatosTramite(tramite) {
    // Información general
    mostrarValor('display-folio', tramite.FOLIO);
    mostrarValor('display-fecha', formatearFecha(tramite.FECHA_ELA));
    mostrarValor('display-titular', tramite.TITULAR);
    mostrarValor('display-recibo', tramite.RECIBO);
    mostrarValor('display-lote', tramite.LOTE);
    mostrarValor('display-inhumacion', tramite.INHUMACION);
    mostrarValor('display-traspaso', tramite.TRASPASO);
    
    // Información adicional
    mostrarValor('display-mantenimiento', tramite.MANTENIMIENTO);
    mostrarValor('display-ampl-cm', tramite.AMPL_CM);
    mostrarValor('display-regularizacion', tramite.REGULARIZACION);
    mostrarValor('display-construccion', tramite.CONSTRUCCION);
    mostrarValor('display-busqueda', tramite.BUSQUEDA_INFO);
    
    // Mostrar costos
    mostrarCostos(tramite);
    
    // Metadatos
    mostrarValor('display-id', tramite._id);
    mostrarValor('display-fecha-creacion', formatearFecha(tramite.FECHA_CREACION));
    mostrarValor('display-fecha-actualizacion', formatearFecha(tramite.FECHA_ACTUALIZACION));
    
    // Mostrar botón de editar
    document.getElementById('btn-editar').style.display = 'inline-block';
    
    // Ocultar loading y mostrar contenido
    ocultarCarga();
}

function editarTramite() {
    if (tramiteActual && tramiteActual._id) {
        window.location.href = `editarTramite.html?id=${tramiteActual._id}`;
    }
}

function imprimirTramite() {
    window.print();
}

function exportarPDF() {
    // Función para exportar a PDF (requiere implementación adicional)
    mostrarMensaje('Funcionalidad de exportar PDF en desarrollo', 'info');
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    cargarDatosTramite();
    
    // Agregar atajos de teclado
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + E para editar
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            editarTramite();
        }
        
        // Ctrl/Cmd + P para imprimir
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            imprimirTramite();
        }
        
        // Escape para volver
        if (e.key === 'Escape') {
            window.location.href = 'tramites.html';
        }
    });
    
    console.log('Sistema de visualización de trámites iniciado');
});