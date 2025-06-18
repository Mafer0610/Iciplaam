document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const lapidaId = urlParams.get("id");

    if (lapidaId) {
        try {
            const response = await fetch(`http://localhost:5000/lapidas/${lapidaId}`);
            if (!response.ok) throw new Error("Error al obtener los datos");

            const lapida = await response.json();
            for (const key in lapida) {
                if (document.getElementById(key)) {
                    document.getElementById(key).value = lapida[key];
                }
            }
        } catch (error) {
            console.error(error);
            window.location.href = "index.html";
        }
    }

    document.getElementById("lapida-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const lapidaData = Object.fromEntries(formData);

        try {
            const response = await fetch(`http://localhost:5000/lapidas/${lapidaData.NOM_REG}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(lapidaData),
            });

            if (!response.ok) throw new Error("Error al actualizar datos");
            alert("Registro actualizado correctamente");
            window.location.href = "lapidas.html";
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    });
});
