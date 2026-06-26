document.addEventListener('DOMContentLoaded', () => {
    // 1. GATEKEEPER SECURITY CHECK: Guard the dashboard
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Access Denied. Please log in first to view your dashboard workspace.");
        window.location.href = 'login.html';
        return;
    }

    fetchMyInventory();
});

// 2. FETCH PERSONAL INVENTORY RECORDS VIA REST HANDSHAKE
async function fetchMyInventory() {
    const token = localStorage.getItem('token');
    const grid = document.getElementById('dashboardGrid');
    if (!grid) return;

    // Debug tracking: Let's see if the token is successfully carrying over
    console.log("Dashboard current token check:", token);

    if (!token) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-12 text-yellow-600 font-medium text-sm">
                Session token missing. Please return to the homepage and log in again.
            </div>`;
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/items/mine`, {
            method: 'GET',
            headers: {
                // Ensure there is a clean space between 'Bearer' and the token string
                'Authorization': `Bearer ${token.trim()}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-12 text-red-500 font-medium text-sm">
                    🔒 Your security token is invalid or expired. Please sign out and log back in on the main market page.
                </div>`;
            return;
        }

        if (!response.ok) throw new Error(`Server responded with code ${response.status}`);

        const items = await response.json();
        renderDashboardGrid(items);
    } catch (err) {
        console.error("Dashboard feed broken:", err);
        grid.innerHTML = `
            <div class="col-span-full text-center py-12 text-red-500 font-medium text-sm">
                Could not connect to your inventory feed. Error: ${err.message}
            </div>`;
    }
}

// 3. RENDER DASHBOARD PRODUCTS
function renderDashboardGrid(items) {
    const grid = document.getElementById('dashboardGrid');
    grid.innerHTML = '';

    if (items.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-16 text-gray-400 text-sm border-2 border-dashed border-gray-200 p-8 sharp-card">
                You haven't listed any items for sale yet. Click "Post Item" above to create your first listing!
            </div>`;
        return;
    }

    items.forEach(item => {
        // Reuse our high-quality visual placeholder map fallback
        const placeholders = {
            'Electronics': 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=500&q=80',
            'Furniture': 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=500&q=80',
            'Kitchenware': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500&q=80',
            'Default': 'https://images.unsplash.com/photo-1580828343064-fde4fc206bc6?w=500&q=80'
        };

        // BACKWARD COMPATIBLE SAFETY BRIDGE LOGIC:
        let displayImage = '';
        if (!item.image_url || item.image_url.trim() === '') {
            displayImage = placeholders[item.category] || placeholders['Default'];
        } else if (item.image_url.startsWith('http://') || item.image_url.startsWith('https://')) {
            displayImage = item.image_url;
        } else {
            displayImage = `http://localhost:5000/${item.image_url}`;
        }

        const postDate = new Date(item.created_at).toLocaleDateString('en-KE', {
            day: 'numeric', month: 'short'
        });

        // On the dashboard, every single item belongs to the user, so they ALL get a delete control
        const cardHtml = `
            <div class="bg-white border border-gray-200 flex flex-col justify-between overflow-hidden shadow-sm">
                <div class="relative aspect-[4/3] w-full bg-gray-100">
                    <img src="${displayImage}" alt="${item.title}" class="w-full h-full object-cover">
                    <span class="absolute top-2 left-2 bg-gray-900 text-white text-[10px] font-bold px-2 py-0.5 tracking-wider uppercase sharp-card">
                        ${item.category}
                    </span>
                </div>

                <div class="p-4 flex flex-col flex-grow justify-between bg-white">
                    <div class="mb-3">
                        <div class="text-lg font-extrabold text-gray-900">KSh ${parseFloat(item.price).toLocaleString()}</div>
                        <h3 class="text-xs font-bold text-gray-700 line-clamp-1">${item.title}</h3>
                        <p class="text-[11px] text-gray-400 mt-1">📍 ${item.location} • Status: ${item.condition}</p>
                    </div>

                    <div>
                    <button onclick="openEditModal(${JSON.stringify(item).replace(/"/g, '&quot;')})" 
                                class="w-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold py-2 text-xs uppercase tracking-wider hover:bg-emerald-100 transition text-center sharp-card mb-2">
                            Edit Details ✏️
                        </button>

                        <button onclick="deleteDashboardItem(${item.id})" 
                                class="w-full bg-red-50 text-red-600 border border-red-200 font-bold py-2 text-xs uppercase tracking-wider hover:bg-red-100 transition text-center sharp-card">
                            Remove Listing 🗑️
                        </button>
                        <div class="text-[9px] text-center text-gray-400 mt-2">Listed on ${postDate}</div>
                    </div>
                </div>
            </div>
        `;
        grid.innerHTML += cardHtml;
    });
}

// 4. DELETE LISTING INTERCEPT SIGNAL
async function deleteDashboardItem(itemId) {
    if (!confirm("Are you sure you want to permanently delete this listing from your store?")) return;

    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_BASE_URL}/items/${itemId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            alert("Listing removed successfully.");
            fetchMyInventory(); // Refresh view instantly
        } else {
            alert(data.message || "Failed to complete deletion request.");
        }
    } catch (err) {
        console.error("Network communication failure during delete:", err);
        alert("Could not connect to database.");
    }
}

// A. OPEN MODAL INTERCEPTOR AND INJECT DATABASE DATA VALUES
function openEditModal(item) {
    document.getElementById('editItemId').value = item.id;
    document.getElementById('editTitle').value = item.title;
    document.getElementById('editPrice').value = Math.round(item.price);
    document.getElementById('editCategory').value = item.category;
    document.getElementById('editCondition').value = item.condition;
    document.getElementById('editLocation').value = item.location;
    // document.getElementById('editImageUrl').value = item.image_url || '';

    // Remove the hidden utility utility layout tag class
    document.getElementById('editModal').classList.remove('hidden');
}

// B. MODAL CLEANUP INTERCEPTOR
function closeEditModal() {
    document.getElementById('editModal').classList.add('hidden');
    document.getElementById('editForm').reset();
}

// C. ASYNCHRONOUS FORM PUT TRANSMISSION HANDSHAKE
async function handleEditFormSubmit(event) {
    event.preventDefault();

    const token = localStorage.getItem('token');
    const itemId = document.getElementById('editItemId').value;

    // 1. Initialize a FormData instance instead of a raw text JSON payload object
    const formData = new FormData();
    
    // 2. Append the text values targeting your exact HTML form input IDs
    formData.append('title', document.getElementById('editTitle').value.trim());
    formData.append('price', parseFloat(document.getElementById('editPrice').value));
    formData.append('category', document.getElementById('editCategory').value);
    formData.append('condition', document.getElementById('editCondition').value);
    formData.append('location', document.getElementById('editLocation').value.trim());

    // 3. Grab the raw file payload if a brand new picture was chosen
    const fileInput = document.getElementById('editImageFile');
    if (fileInput && fileInput.files.length > 0) {
        formData.append('image', fileInput.files[0]);
    }

    try {
        const response = await fetch(`${API_BASE_URL}/items/${itemId}`, {
            method: 'PUT',
            headers: {
                // CRITICAL: Leave Content-Type header completely blank here!
                // The browser will inject its own boundary strings for FormData payloads.
                'Authorization': `Bearer ${token}`
            },
            body: formData // Dispatch the multipart file package
        });

        const data = await response.json();

        if (response.ok) {
            alert("Listing modifications saved successfully! 🎉");
            closeEditModal();
            fetchMyInventory(); // Instantly reloads the dashboard view state
        } else {
            alert(data.message || "Failed to finalize structural edits.");
        }
    } catch (err) {
        console.error("Critical communication failure during network payload put:", err);
        alert("Error connecting to server database pipeline.");
    }
}