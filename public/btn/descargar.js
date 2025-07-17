/**
 * Archivo: descargarRela.js
 * Descripción: Script para generar y descargar la relación de trámites en formato Excel
 * Autor: Sistema de Panteón Municipal
 */

class DescargadorRelacion {
    constructor() {
        this.añoActual = new Date().getFullYear();
        this.tramitesCache = [];
    }

    /**
     * Función principal para descargar la relación de trámites
     * @param {number} año - Año para filtrar los trámites (opcional, por defecto año actual)
     */
    async descargarRelacionTramites(año = null) {
        try {
            const añoSeleccionado = año || this.añoActual;
            
            console.log(`📊 Iniciando descarga de relación de trámites para el año ${añoSeleccionado}`);
            
            // Mostrar mensaje de carga
            this.mostrarMensajeCarga('Generando archivo Excel...');
            
            // Realizar petición al servidor
            const response = await fetchAutenticado(`http://localhost:5000/tramites/excel/${añoSeleccionado}`);
            
            if (!response.ok) {
                throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
            }
            
            // Obtener el blob del archivo
            const blob = await response.blob();
            
            // Crear URL temporal para descarga
            const url = window.URL.createObjectURL(blob);
            
            // Crear elemento de descarga
            const elemento = document.createElement('a');
            elemento.href = url;
            elemento.download = `Relacion_Tramites_${añoSeleccionado}.xlsx`;
            elemento.style.display = 'none';
            
            // Agregar al DOM, hacer clic y remover
            document.body.appendChild(elemento);
            elemento.click();
            document.body.removeChild(elemento);
            
            // Limpiar URL temporal
            window.URL.revokeObjectURL(url);
            
            // Mostrar mensaje de éxito
            this.mostrarMensajeExito(`Archivo descargado correctamente: Relacion_Tramites_${añoSeleccionado}.xlsx`);
            
            console.log(`✅ Descarga completada exitosamente`);
            
        } catch (error) {
            console.error('❌ Error al descargar relación de trámites:', error);
            this.mostrarMensajeError(`Error al descargar el archivo: ${error.message}`);
        }
    }

    /**
     * Descargar relación con rango de fechas personalizado
     * @param {Date} fechaInicio - Fecha de inicio
     * @param {Date} fechaFin - Fecha de fin
     */
    async descargarRelacionPersonalizada(fechaInicio, fechaFin) {
        try {
            console.log(`📊 Descargando relación personalizada desde ${fechaInicio.toISOString()} hasta ${fechaFin.toISOString()}`);
            
            this.mostrarMensajeCarga('Generando archivo Excel personalizado...');
            
            // Obtener trámites del rango de fechas
            const tramites = await this.obtenerTramitesPorRango(fechaInicio, fechaFin);
            
            if (tramites.length === 0) {
                this.mostrarMensajeAdvertencia('No se encontraron trámites en el rango de fechas especificado');
                return;
            }
            
            // Generar Excel local (si el servidor no soporta rangos personalizados)
            await this.generarExcelLocal(tramites, `${fechaInicio.getFullYear()}-${fechaFin.getFullYear()}`);
            
        } catch (error) {
            console.error('❌ Error al descargar relación personalizada:', error);
            this.mostrarMensajeError(`Error al generar archivo personalizado: ${error.message}`);
        }
    }

    /**
     * Obtener trámites por rango de fechas
     * @param {Date} fechaInicio 
     * @param {Date} fechaFin 
     * @returns {Array} Array de trámites
     */
    async obtenerTramitesPorRango(fechaInicio, fechaFin) {
        try {
            const response = await fetchAutenticado(`http://localhost:5000/tramites?fechaInicio=${fechaInicio.toISOString()}&fechaFin=${fechaFin.toISOString()}`);
            
            if (!response.ok) {
                throw new Error('Error al obtener trámites del servidor');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error al obtener trámites por rango:', error);
            throw error;
        }
    }

    /**
     * Generar Excel localmente usando XLSX
     * @param {Array} tramites - Array de trámites
     * @param {string} sufijo - Sufijo para el nombre del archivo
     */
    async generarExcelLocal(tramites, sufijo) {
        try {
            // Verificar que XLSX esté disponible
            if (typeof XLSX === 'undefined') {
                throw new Error('Biblioteca XLSX no está disponible');
            }

            // Crear workbook
            const workbook = XLSX.utils.book_new();
            
            // Crear encabezados
            const encabezados = [
                ['SECRETARIA DE SERVICIOS MUNICIPALES'],
                ['DIRECCION DE PANTEONES'],
                [`RELACION DE TRAMITES CORRESPONDIENTE AL EJERCICIO ${this.añoActual} PANTEONES PUBLICOS MUNICIPALES`],
                [''],
                [
                    'FECHA DE ELABORACION',
                    'FOLIOS',
                    'NOMBRE  DEL TITULAR',
                    'INHUMACION DE:',
                    'NOMBRE TITULAR SALIENTE (TRASPASOS)',
                    'RECIBO OFICIAL',
                    'COSTO DE INHUMACION',
                    'COSTO DE LA EXHUMACIÓN',
                    'REPOSICIÓN CONSTANCIA',
                    'COSTO DEL TRASPASO',
                    'LOTE',
                    'MANTENIMIENTO',
                    'AMPL CM LINEAL',
                    'REGULARIZACION LOTES',
                    'CONSTRUCCION',
                    'BUSQUEDAD DE INFORMACION'
                ]
            ];
            
            // Convertir trámites a formato de filas
            const filasTramites = tramites.map(tramite => [
                tramite.FECHA_ELA ? new Date(tramite.FECHA_ELA).toLocaleDateString('es-MX') : '',
                tramite.FOLIO || '',
                tramite.TITULAR || '',
                tramite.INHUMACION || '',
                tramite.TRASPASO || '',
                tramite.RECIBO || '',
                tramite.COSTO_INHU || '',
                tramite.COSTO_EXHU || '',
                tramite.REPOSICION || '',
                tramite.COSTO_TRASPASO || '',
                tramite.LOTE || '',
                tramite.MANTENIMIENTO || '',
                tramite.AMPL_CM || '',
                tramite.REGULARIZACION || '',
                tramite.CONSTRUCCION || '',
                tramite.BUSQUEDA_INFO || ''
            ]);
            
            // Combinar encabezados y datos
            const todosLosDatos = [...encabezados, ...filasTramites];
            
            // Crear hoja de trabajo
            const worksheet = XLSX.utils.aoa_to_sheet(todosLosDatos);
            
            // Configurar anchos de columnas
            worksheet['!cols'] = [
                { wch: 15 }, { wch: 10 }, { wch: 25 }, { wch: 20 },
                { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
                { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 15 },
                { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 20 }
            ];
            
            // Agregar hoja al workbook
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Tramites');
            
            // Escribir archivo
            XLSX.writeFile(workbook, `Relacion_Tramites_${sufijo}.xlsx`);
            
            this.mostrarMensajeExito(`Archivo generado: Relacion_Tramites_${sufijo}.xlsx`);
            
        } catch (error) {
            console.error('Error al generar Excel local:', error);
            throw error;
        }
    }

    /**
     * Mostrar estadísticas de trámites antes de descargar
     * @param {number} año 
     */
    async mostrarEstadisticas(año = null) {
        try {
            const añoSeleccionado = año || this.añoActual;
            
            // Obtener estadísticas del servidor
            const response = await fetchAutenticado(`http://localhost:5000/tramites/estadisticas/${añoSeleccionado}`);
            
            if (response.ok) {
                const estadisticas = await response.json();
                
                const mensaje = `
                    Estadísticas del año ${añoSeleccionado}:
                    - Total de trámites: ${estadisticas.total}
                    - Inhumaciones: ${estadisticas.inhumaciones || 0}
                    - Exhumaciones: ${estadisticas.exhumaciones || 0}
                    - Traspasos: ${estadisticas.traspasos || 0}
                    - Reposiciones: ${estadisticas.reposiciones || 0}
                `;
                
                console.log(mensaje);
                return estadisticas;
            }
        } catch (error) {
            console.log('No se pudieron obtener estadísticas:', error);
        }
        
        return null;
    }

    // Métodos para mostrar mensajes
    mostrarMensajeCarga(mensaje) {
        this.mostrarMensaje(mensaje, 'info');
    }

    mostrarMensajeExito(mensaje) {
        this.mostrarMensaje(mensaje, 'success');
    }

    mostrarMensajeError(mensaje) {
        this.mostrarMensaje(mensaje, 'error');
    }

    mostrarMensajeAdvertencia(mensaje) {
        this.mostrarMensaje(mensaje, 'warning');
    }

    mostrarMensaje(mensaje, tipo) {
        // Intentar usar el sistema de mensajes existente
        if (typeof mostrarMensaje === 'function') {
            mostrarMensaje(mensaje);
            return;
        }

        // Fallback: crear mensaje flotante
        let mensajeDiv = document.getElementById('mensaje-flotante-descarga');
        
        if (!mensajeDiv) {
            mensajeDiv = document.createElement('div');
            mensajeDiv.id = 'mensaje-flotante-descarga';
            mensajeDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #333;
                color: white;
                padding: 12px 20px;
                border-radius: 6px;
                box-shadow: 0 0 10px rgba(0,0,0,0.3);
                z-index: 9999;
                opacity: 0;
                transition: opacity 0.3s ease-in-out;
            `;
            document.body.appendChild(mensajeDiv);
        }

        // Configurar color según tipo
        const colores = {
            info: '#2196F3',
            success: '#4CAF50',
            error: '#F44336',
            warning: '#FF9800'
        };

        mensajeDiv.style.background = colores[tipo] || '#333';
        mensajeDiv.textContent = mensaje;
        mensajeDiv.style.opacity = '1';

        setTimeout(() => {
            if (mensajeDiv) {
                mensajeDiv.style.opacity = '0';
            }
        }, 3000);
    }
}

// Crear instancia global
const descargadorRelacion = new DescargadorRelacion();

// Función global para usar en botones
window.descargarExcel = function(año = null) {
    return descargadorRelacion.descargarRelacionTramites(año);
};

// Función para descargar con rango personalizado
window.descargarExcelPersonalizado = function(fechaInicio, fechaFin) {
    return descargadorRelacion.descargarRelacionPersonalizada(fechaInicio, fechaFin);
};

// Función para mostrar estadísticas
window.mostrarEstadisticasTramites = function(año = null) {
    return descargadorRelacion.mostrarEstadisticas(año);
};

console.log('✅ Sistema de descarga de relación de trámites cargado');