// 1. GATEKEEPER CHECK: Redirect to login if user isn't logged in
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Access Denied. You must log in to list an item.");
        window.location.href = 'login.html';
    }
});

// 2. FORM SUBMISSION INTERCEPTOR
document.getElementById('uploadForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    
    // Extract input fields
    const payload = {
        title: document.getElementById('itemTitle').value,
        price: parseFloat(document.getElementById('itemPrice').value),
        location: document.getElementById('itemLocation').value,
        category: document.getElementById('itemCategory').value,
        condition: document.getElementById('itemCondition').value,
        image_url: document.getElementById('itemImageUrl').value || null,
        description: document.getElementById('itemDescription').value
    };

    try {
        // Post data to the dynamic creation route
        const response = await fetch(`${API_BASE_URL}/items/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Pass security credential clearance token
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            alert("Success! Your item is live on the marketplace. 📦");
            window.location.href = 'index.html'; // Redirect straight to the main browsing grid
        } else {
            alert(data.message || "Failed to list item.");
        }
    } catch (err) {
        console.error("Error creating listing:", err);
        alert("Failed to connect to backend server api pipeline.");
    }
});

// 3. LOGOUT MECHANICS SHORTCUT
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.clear();
    alert("Logged out successfully.");
    window.location.href = 'index.html';
});