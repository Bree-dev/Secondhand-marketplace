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
    
    //  STEP A: Initialize FormData to construct a multipart stream instead of standard text JSON
    const formData = new FormData();
    
    // STEP B: Append all text fields matching your specific HTML input IDs precisely
    formData.append('title', document.getElementById('itemTitle').value.trim());
    formData.append('price', parseFloat(document.getElementById('itemPrice').value));
    formData.append('location', document.getElementById('itemLocation').value.trim());
    formData.append('category', document.getElementById('itemCategory').value);
    formData.append('condition', document.getElementById('itemCondition').value);
    formData.append('description', document.getElementById('itemDescription').value.trim());

    //  STEP C: Grab the binary file payload from your upgraded input tag
    const fileInput = document.getElementById('imageFile');
    if (fileInput && fileInput.files.length > 0) {
        formData.append('image', fileInput.files[0]); // 'image' targets upload.single('image') inside the backend router
    }

    try {
        // Post binary data to the dynamic creation route
        const response = await fetch(`${API_BASE_URL}/items/create`, {
            method: 'POST',
            headers: {
                // ⚠️ CRITICAL REMINDER: 'Content-Type' header is deliberately omitted here!
                // The browser needs to inject its own boundary string parameters dynamically.
                'Authorization': `Bearer ${token}` 
            },
            body: formData // Dispatch the multipart file packet data matrix
        });

        const data = await response.json();

        if (response.ok) {
            alert("Success! Your item is live on the marketplace with its photo. 📦");
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