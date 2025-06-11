async function eliminarRegistro(id) {
    if (confirm("¿Estás seguro de que deseas borrar este registro?")) {
        try {
            const response = await fetch(`http://localhost:5000/lapidas/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                alert("Registro eliminado correctamente.");
                cargarTabla();
            } else {
                alert("Error al eliminar el registro.");
            }
        } catch (error) {
            console.error("Error al borrar el registro:", error);
        }
    }
}