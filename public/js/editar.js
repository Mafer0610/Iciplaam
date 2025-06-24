document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const nomReg = urlParams.get("NOM_REG");

    if (nomReg) {
        try {
            const response = await fetchAutenticado(`http://localhost:5000/lapidas/${nomReg}`);
            if (!response.ok) throw new Error("Error al obtener los datos");

            const lapida = await response.json();
            
            for (const key in lapida) {
                const element = document.getElementById(key);
                if (element) {
                    element.value = lapida[key] || "";
                }
            }
        } catch (error) {
            console.error("Error al cargar los datos:", error);
            alert("Error al cargar los datos de la lápida");
        }
    }

    document.getElementById("lapida-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const lapidaData = Object.fromEntries(formData);

        try {
            const response = await fetchAutenticado(`http://localhost:5000/lapidas/${lapidaData.NOM_REG}`, {
                method: "PUT",
                body: JSON.stringify(lapidaData),
            });

            if (!response.ok) throw new Error("Error al actualizar datos");
            
            const result = await response.json();
            alert("Registro actualizado correctamente");
            window.location.href = "../panelAdmin.html";
        } catch (error) {
            console.error("Error al actualizar:", error);
            alert("Error al actualizar el registro: " + error.message);
        }
    });
});