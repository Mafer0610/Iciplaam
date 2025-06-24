function verificarAutenticacion() {
    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    
    if (!token || !userRole) {
        window.location.href = '/index.html';
        return false;
    }
    
    return { token, userRole };
}

function verificarRolAdmin() {
    const auth = verificarAutenticacion();
    if (!auth) return false;
    
    if (auth.userRole !== 'admin') {
        alert('No tienes permisos para acceder a esta sección');
        window.location.href = '/panelUser.html';
        return false;
    }
    
    return true;
}

function cerrarSesion() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    window.location.href = '/index.html';
}

async function fetchAutenticado(url, options = {}) {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        window.location.href = '/index.html';
        return;
    }
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };
    
    try {
        const response = await fetch(url, {
            ...options,
            headers
        });
        
        if (response.status === 401) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userRole');
            window.location.href = '/index.html';
            return;
        }
        
        return response;
    } catch (error) {
        console.error('Error en petición autenticada:', error);
        throw error;
    }
}