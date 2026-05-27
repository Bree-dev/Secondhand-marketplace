document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const whatsapp_number = document.getElementById('regWhatsApp').value;
    const password = document.getElementById('regPassword').value;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, whatsapp_number, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert("Registration successful! 🎉 Redirecting to login...");
            window.location.href = 'login.html';
        } else {
            alert(data.message || "Registration failed.");
        }
    } catch (err) {
        console.error("Error during registration:", err);
        alert("Could not connect to the server.");
    }
});

document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Securely save token and user variables locally
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            alert("Welcome back! Redirecting to marketplace...");
            window.location.href = 'index.html';
        } else {
            alert(data.message || "Login credentials invalid.");
        }
    } catch (err) {
        console.error("Login failure:", err);
        alert("Server connection timed out.");
    }
});