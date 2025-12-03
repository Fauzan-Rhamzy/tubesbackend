/**
 * Fungsi untuk handle login
 */
async function handleLogin(email, password) {
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Simpan data user ke localStorage
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('username', data.username);
            localStorage.setItem('role', data.role);
            localStorage.setItem('email', email);

            return {
                success: true,
                user: data
            };
        } else {
            return {
                success: false,
                message: data.message || 'Login gagal'
            };
        }
    } catch (error) {
        console.error('Login error:', error);
        return {
            success: false,
            message: 'Terjadi kesalahan saat login'
        };
    }
}

/**
 * Fungsi untuk cek apakah user sudah login
 */
function isLoggedIn() {
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');

    return !!(userId && username);
}

/**
 * Fungsi untuk mendapatkan data user yang sedang login
 */
function getCurrentUser() {
    if (!isLoggedIn()) {
        return null;
    }

    return {
        userId: localStorage.getItem('userId'),
        username: localStorage.getItem('username'),
        role: localStorage.getItem('role'),
        email: localStorage.getItem('email')
    };
}

/**
 * Fungsi untuk logout
 */
function logout() {
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    localStorage.removeItem('selectedRoomId');
}

/**
 * Export fungsi-fungsi untuk digunakan di file lain
 */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        handleLogin,
        isLoggedIn,
        getCurrentUser,
        logout
    };
}