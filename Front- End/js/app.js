// Global tracking variables for state management
let currentCategory = 'All';
let searchQuery = '';

// 1. INITIALIZE FEED ON PAGE LOAD
document.addEventListener('DOMContentLoaded', () => {
    initializeHeaderAuthStates(); // 1.5 Evaluates JWT tokens to build dynamic navbar states
    fetchMarketplaceItems();      // 2. Loads live entries from the database
    setupEventListeners();        // 4. Sets up user action listeners
});

// 1.5 DYNAMIC NAVIGATION HEADER MANAGER
function initializeHeaderAuthStates() {
    const navActions = document.getElementById('navActions');
    if (!navActions) return;

    const token = localStorage.getItem('token');
    let currentUser = {};
    
    try {
        currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    } catch (e) {
        console.error("Error parsing user payload from localStorage:", e);
    }

    // SCENARIO A: User is fully authenticated and logged in
    if (token) {
        // Fallback to generic word if the name key is corrupt or missing
        const displayName = currentUser.name ? currentUser.name.split(' ')[0] : 'User';

        navActions.innerHTML = `
            <span class="text-gray-500 font-semibold text-xs md:text-sm">Hi, ${displayName}! 👋</span>
            <a href="upload.html" class="bg-emerald-600 text-white px-3 py-1.5 md:px-4 md:py-2 font-semibold hover:bg-emerald-700 transition sharp-card block text-center">Post Item</a>
            <button onclick="handleUserLogout()" class="text-red-500 hover:text-red-700 font-bold transition text-xs md:text-sm">Logout</button>
        `;
    } 
    // SCENARIO B: Visitor is anonymous (Logged Out)
    else {
        navActions.innerHTML = `
            <a href="#" class="text-gray-600 hover:text-emerald-600 hidden sm:inline-block">Browse</a>
            <a href="login.html" class="bg-gray-900 text-white px-3 py-1.5 md:px-4 md:py-2 font-semibold hover:bg-gray-800 transition sharp-card block text-center">Login to Sell</a>
            <a href="register.html" class="text-gray-600 hover:text-emerald-600 hidden md:inline-block">Register</a>
        `;
    }
}

// Global window logout trigger helper
function handleUserLogout() {
    if (!confirm("Are you sure you want to log out of your session?")) return;
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Hard refresh environment state
    window.location.href = 'index.html';
}

// 2. FETCH LIVE DATA FROM POSTGRESQL API
async function fetchMarketplaceItems() {
    try {
        let url = `${API_BASE_URL}/items?category=${encodeURIComponent(currentCategory)}`;
        if (searchQuery) {
            url += `&search=${encodeURIComponent(searchQuery)}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response failure.');
        
        const items = await response.json();
        renderGrid(items);
    } catch (err) {
        console.error("Failed to load marketplace items:", err);
        const grid = document.getElementById('productGrid');
        if (grid) {
            grid.innerHTML = `<div class="col-span-full text-center py-12 text-red-500 font-medium text-sm">Could not connect to the database feed. Make sure your server is running.</div>`;
        }
    }
}

// 3. RENDER DYNAMIC CARD GRID (WITH SECURE OWNER DELETE CONTROLS)
function renderGrid(itemsToDisplay) {
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    
    grid.innerHTML = '';

    if (itemsToDisplay.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-12 text-gray-400 text-sm">No items match your search parameters.</div>`;
        return;
    }

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');

    itemsToDisplay.forEach(item => {
        const postDate = new Date(item.created_at).toLocaleDateString('en-KE', {
            day: 'numeric', month: 'short'
        });

        const message = encodeURIComponent(`Hi, I'm interested in your "${item.title}" listed for KSh ${item.price}. Is it still available?`);
        const waLink = `https://wa.me/${item.whatsapp_number}?text=${message}`;

        let deleteButtonHtml = '';
        if (token && currentUser.id === item.seller_id) {
            deleteButtonHtml = `
                <button onclick="deleteMarketplaceItem(${item.id})" 
                        class="mt-2 w-full bg-red-100 text-red-600 font-bold py-2 text-xs uppercase tracking-wider hover:bg-red-200 transition text-center sharp-card">
                    Delete Listing 🗑️
                </button>
            `;
        }

        const cardHtml = `
            <div class="bg-white border border-gray-200 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md transition">
                <div class="relative aspect-[4/3] w-full bg-gray-100">
                    <img src="${item.image_url || 'https://via.placeholder.com/400x300?text=No+Image'}" alt="${item.title}" class="w-full h-full object-cover">
                </div>

                <div class="p-4 flex flex-col flex-grow justify-between bg-white">
                    <div class="mb-4">
                        <div class="text-xl font-extrabold text-gray-900 mb-0.5">KSh ${parseFloat(item.price).toLocaleString()}</div>
                        <h3 class="text-sm font-bold text-gray-800 line-clamp-1 mb-3">${item.title}</h3>
                        
                        <div class="space-y-2 border-t border-gray-100 pt-2 text-sm">
                            <div class="flex items-center justify-between">
                                <span class="text-gray-500 font-medium flex items-center gap-1">Condition</span>
                                <span class="font-bold text-gray-900 bg-gray-100 px-2.5 py-0.5 text-xs tracking-wide uppercase">
                                    ${item.condition}
                                </span>
                            </div>
                            
                            <div class="flex items-center justify-between">
                                <span class="text-gray-500 font-medium flex items-center gap-1">Location</span>
                                <span class="font-bold text-gray-900 text-sm tracking-tight">
                                    ${item.location}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <a href="${waLink}" target="_blank" 
                           class="w-full bg-emerald-600 text-white font-bold py-2.5 px-4 text-xs tracking-wider uppercase text-center flex items-center justify-center gap-2 hover:bg-emerald-700 transition">
                            Chat on WhatsApp
                        </a>
                        
                        ${deleteButtonHtml}
                        
                        <div class="text-[10px] text-right text-gray-400 mt-2">Posted ${postDate} by ${item.seller_name || 'Seller'}</div>
                    </div>
                </div>
            </div>
        `;
        grid.innerHTML += cardHtml;
    });
}

// 4. BIND EVENT LISTENERS FOR LIVE USER INTERACTION
function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.trim();
            fetchMarketplaceItems();
        });
    }
}

// 5. SECURE NETWORK REQUEST SIGNAL FOR PRODUCT REMOVAL
async function deleteMarketplaceItem(itemId) {
    if (!confirm("Are you sure you want to permanently delete this listing? This action cannot be undone.")) return;

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
            alert(data.message);
            fetchMarketplaceItems();
        } else {
            alert(data.message || "Failed to complete deletion request.");
        }
    } catch (err) {
        console.error("Network communication failure during delete process:", err);
        alert("Could not reach backend application database network.");
    }
}