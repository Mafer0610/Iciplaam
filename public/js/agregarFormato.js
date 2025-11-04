// agregarFormato.js - Lógica para agregar formatos de control

function mostrarMensaje(mensaje, tipo) {
    const messageDiv = document.getElementById('status-message');
    messageDiv.textContent = mensaje;
    messageDiv.className = `status-message status-${tipo}`;
    messageDiv.style.display = 'block';
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

function recopilarDatosFormato() {
    const datos = {};

    // Información básica
    datos.NOMB_CONTRI = document.getElementById('NOMB_CONTRI').value || '';
    datos.DIRECCION = document.getElementById('DIRECCION').value || '';
    datos.UBICACION_LOTE = document.getElementById('UBICACION_LOTE').value || '';
    datos.MEDIDA_TRAMITE = document.getElementById('MEDIDA_TRAMITE').value || '';
    datos.OTROS = document.getElementById('OTROS').value || '';

    console.log('=== VERIFICANDO CHECKBOXES DE TIPO DE TRÁMITE ===');
    
    // Mapeo de tipos de trámite
    const mapeoTipos = [
        { checkbox: 'INHUMACION', plantilla: 'INHUMACION' },
        { checkbox: 'REP_BOLETA', plantilla: 'REP_BOLETA' },
        { checkbox: 'TRASP_LOTE', plantilla: 'TRASPASO' },
        { checkbox: 'TRASPA_SISTEMA', plantilla: 'ALTA_SISTEMA' },
        { checkbox: 'CONSTRUC_GAVETA', plantilla: 'CONSTRUCCION' },
        { checkbox: 'CONSTRUC_DEPOSITO', plantilla: 'DEPOSITO_CENIZAS' },
        { checkbox: 'EXHUMA_CENIZAS', plantilla: 'EXHUMACION' }
    ];

    // Para la plantilla Word
    mapeoTipos.forEach(item => {
        const checkbox = document.getElementById(item.checkbox);
        if (checkbox) {
            datos[item.plantilla] = checkbox.checked ? 'X' : '';
            console.log(`${item.checkbox} → ${item.plantilla}: checked=${checkbox.checked}, valor="${datos[item.plantilla]}"`);
        } else {
            datos[item.plantilla] = '';
            console.log(`${item.checkbox} → ${item.plantilla}: checkbox NO EXISTE`);
        }
    });

    // Para la base de datos
    datos.TIPO_TRAMITE = [];
    mapeoTipos.forEach(item => {
        const checkbox = document.getElementById(item.checkbox);
        if (checkbox && checkbox.checked) {
            datos.TIPO_TRAMITE.push(item.checkbox);
        }
    });

    console.log('Array TIPO_TRAMITE para BD:', datos.TIPO_TRAMITE);

    // Documentos entregados
    const documentosIds = [
        'BOLETA_PROPIEDAD', 'PAGO_MANTENIMIENTO', 'INE_PROPIETARIO',
        'PARIENTE', 'TESTIGOS', 'NVO_PROPIETARIO',
        'ACTA_DEFUNCION', 'INHUMADO', 'PROPIETARIO_EXHUMADO',
        'ORDEN_INHUMACION', 'OFICIO_SOLICITUD', 'ACTA_NACIMIENTO',
        'ACTA_MATRIMONIO', 'CARTA_PODER', 'FOTO_LOTE', 'CARTA_RESPONSIVA',
        'CONSTRUCCION_CARTA', 'EXHUMACION_CARTA', 'TRASPASO_CARTA', 'OTROS_CHECK'
    ];

    // Para la plantilla Word
    documentosIds.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            datos[id] = checkbox.checked ? 'X' : '';
            console.log(`${id}: checked=${checkbox.checked}, valor="${datos[id]}"`);
        } else {
            datos[id] = '';
            console.log(`${id}: checkbox NO EXISTE`);
        }
    });

    // Para la base de datos
    datos.DOCUMENTOS_ENTREGADOS = [];
    documentosIds.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox && checkbox.checked) {
            datos.DOCUMENTOS_ENTREGADOS.push(id);
        }
    });

    console.log('Array DOCUMENTOS_ENTREGADOS para BD:', datos.DOCUMENTOS_ENTREGADOS);
    console.log(JSON.stringify(datos, null, 2));

    return datos;
}

async function guardarFormato(datos) {
    try {
        console.log('Enviando formato a BD:', datos);
        const response = await fetch('http://localhost:5000/control', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datos)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('Formato guardado en base de datos:', result);
            mostrarMensaje('Formato guardado en base de datos correctamente', 'success');
            return true;
        } else {
            const error = await response.json();
            console.error('Error al guardar formato:', error);
            mostrarMensaje(`Error al guardar formato: ${error.error}`, 'error');
            return false;
        }
    } catch (error) {
        console.error('Error al guardar formato:', error);
        mostrarMensaje('Error de conexión al guardar formato', 'error');
        return false;
    }
}

async function generarFormato(datos) {
    try {
        mostrarMensaje('Generando Formato de Control...', 'success');
        
        const response = await fetch('http://localhost:5000/generar-tramite', {
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
            a.download = `Formato_de_Control_${new Date().toISOString().split('T')[0]}.docx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            mostrarMensaje('Formato de control generado y descargado correctamente', 'success');
            return true;
        } else {
            const error = await response.json();
            mostrarMensaje(`Error: ${error.error}`, 'error');
            return false;
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error al generar el formato de control', 'error');
        return false;
    }
}

async function guardarSoloFormato() {
    console.log('=== GUARDANDO SOLO FORMATO ===');
    const datos = recopilarDatosFormato();
    console.log('Datos de formato recopilados:', datos);
    
    const guardado = await guardarFormato(datos);
    
    if (guardado) {
        setTimeout(() => {
            window.location.href = '../panelFormatos.html';
        }, 2000);
    }
}

// Event listener para el formulario
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('formatoForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('=== ENVIANDO FORMATO DE CONTROL ===');
        const datos = recopilarDatosFormato();
        console.log('Datos de formato recopilados:', datos);
        
        // Generar documento
        const generado = await generarFormato(datos);
        
        // Guardar en base de datos
        if (generado) {
            const guardado = await guardarFormato(datos);
            
            if (guardado) {
                setTimeout(() => {
                    window.location.href = '../panelFormatos.html';
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

    console.log('Sistema de generación de formatos iniciado');
});