// Global API URL Configuration
const API_BASE_URL = 'https://secondhand-marketplace-api.onrender.com/api/v1';
// Global tracking variables for state management
let currentCategory = 'All';
let searchQuery = '';

let globalItemsArray = []; //  this  holds  items in memory
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

        //  WE ARE UPDATING THIS INNERHTML BLOCK TO ADD THE DASHBOARD LINK:
        navActions.innerHTML = `
            <a href="dashboard.html" class="text-gray-700 hover:text-emerald-600 font-bold text-xs md:text-sm underline cursor-pointer decoration-dotted decoration-1 underline-offset-4 mr-2">
                My Workspace (Hi, ${displayName}! 👋)
            </a>
            <a href="upload.html" class="bg-emerald-600 text-white px-3 py-1.5 md:px-4 md:py-2 font-semibold hover:bg-emerald-700 transition sharp-card block text-center">Post Item</a>
            <button onclick="handleUserLogout()" class="text-red-500 hover:text-red-700 font-bold transition text-xs md:text-sm">Logout</button>
        `;
    }
    // SCENARIO B: Visitor is anonymous (Logged Out)
    else {
        // Boosted base grays to bg-gray-200 and hover states to bg-gray-300 for better structural definition
        navActions.innerHTML = `
            <div class="flex items-center space-x-2">
                <a href="register.html" 
                   class="bg-gray-200 text-gray-800 hover:text-emerald-600 hover:bg-gray-300 px-3 py-1.5 text-xs font-bold tracking-tight sharp-card transition duration-200 block text-center whitespace-nowrap">
                    Register
                </a>
                <a href="login.html" 
                   class="bg-gray-200 text-gray-800 hover:text-emerald-600 hover:bg-gray-300 px-3 py-1.5 text-xs font-bold tracking-tight sharp-card transition duration-200 block text-center whitespace-nowrap">
                    Login to Sell
                </a>
            </div>
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
        globalItemsArray = items; // Store the fetched items in the global array for later use
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

        // 1. Define high-quality category placeholders
        const placeholders = {
            'Electronics': 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=500&q=80',
            'Furniture': 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=500&q=80',
            'Kitchenware': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500&q=80',
            'Default': 'https://images.unsplash.com/photo-1580828343064-fde4fc206bc6?w=500&q=80'
        };

        // 2. BACKWARD COMPATIBLE SAFETY BRIDGE LOGIC:
        let displayImage = '';
        if (!item.image_url || item.image_url.trim() === '') {
            displayImage = placeholders[item.category] || placeholders['Default'];
        } else if (item.image_url.startsWith('http://') || item.image_url.startsWith('https://')) {
            displayImage = item.image_url;
        } else {
           displayImage = `https://secondhand-marketplace-api.onrender.com/${item.image_url}`;
        }

        const postDate = new Date(item.created_at).toLocaleDateString('en-KE', {
            day: 'numeric', month: 'short'
        });

        const message = encodeURIComponent("Hi, I'm interested in your \"" + item.title + "\" listed for KSh " + item.price + ". Is it still available?");
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

        // Prepare raw JSON payload securely to avoid script syntax breakages inside onclick assignment
       // const itemJsonString = JSON.stringify(item).replace(/"/g, '&quot;');

        const cardHtml = `
            <div class="bg-white border border-gray-200 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md transition">
        
        <div onclick="openProductModalById(${item.id})" class="cursor-pointer group flex-grow flex flex-col">
            <div class="relative aspect-[4/3] w-full bg-gray-100 overflow-hidden">
                        <img src="${displayImage}" alt="${item.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
                    </div>

                    <div class="p-4 flex flex-col flex-grow justify-between">
                        <div class="mb-4">
                            <div class="text-xl font-extrabold text-gray-900 mb-0.5">KSh ${parseFloat(item.price).toLocaleString()}</div>
                            <h3 class="text-sm font-bold text-gray-800 line-clamp-1 mb-3 group-hover:text-emerald-600 transition">${item.title}</h3>
                            
                            <div class="space-y-2 border-t border-gray-100 pt-2 text-sm">
                                <div class="flex items-center justify-between">
                                    <span class="text-gray-500 font-medium text-xs">Condition</span>
                                    <span class="font-bold text-gray-900 bg-gray-100 px-2.5 py-0.5 text-[10px] tracking-wide uppercase">
                                        ${item.condition}
                                    </span>
                                </div>
                                
                                <div class="flex items-center justify-between">
                                    <span class="text-gray-500 font-medium text-xs">Location</span>
                                    <span class="font-bold text-gray-900 text-xs tracking-tight">
                                         ${item.location}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="p-4 pt-0">
                    <a href="${waLink}" target="_blank" 
                       class="w-full bg-emerald-600 text-white font-bold py-2.5 px-4 text-xs tracking-wider uppercase text-center flex items-center justify-center gap-2 hover:bg-emerald-700 transition">
                        Chat on WhatsApp
                    </a>
                    
                    ${deleteButtonHtml}
                    
                    <div class="text-[10px] text-right text-gray-400 mt-2">Posted ${postDate} by ${item.seller_name || 'Seller'}</div>
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

// 6. ADD DYNAMIC FILTER CLICK HANDLER
function filterCategory(selectedCategory) {
    // Normalizes 'ALL', 'all', or 'All' to exactly 'All' so your backend conditional catches it cleanly!
    if (selectedCategory.toUpperCase() === 'ALL') {
        currentCategory = 'All';
    } else {
        currentCategory = selectedCategory;
    }
    fetchMarketplaceItems();
}

//  7. OPEN DETAILED PREVIEW MODAL LIGHTBOX
function openProductModalById(itemId) {
    // Find the perfect item object from our memory array using its ID
    const item = globalItemsArray.find(i => i.id === itemId);
    if (!item) return;

    alert("Keys inside item object: " + Object.keys(item).join(", ") + "\n\nDescription Value: " + item.description);

    console.log("Database Item Properties Payload:", item);

    const placeholders = {
        'Electronics': 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=500&q=80',
        'Furniture': 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=500&q=80',
        'Kitchenware': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500&q=80',
        'Default': 'https://images.unsplash.com/photo-1580828343064-fde4fc206bc6?w=500&q=80'
    };

    let fullDisplayImage = '';
    if (!item.image_url || item.image_url.trim() === '') {
        fullDisplayImage = placeholders[item.category] || placeholders['Default'];
    } else if (item.image_url.startsWith('http://') || item.image_url.startsWith('https://')) {
        fullDisplayImage = item.image_url;
    } else {
        fullDisplayImage = `https://secondhand-marketplace-api.onrender.com/${item.image_url}`;
    }

    // Assign clean values directly to your modal components
    document.getElementById('modalImage').src = fullDisplayImage;
    document.getElementById('modalImage').alt = item.title;
    document.getElementById('modalTitle').innerText = item.title;
    document.getElementById('modalCategory').innerText = item.category;
    document.getElementById('modalPrice').innerText = `KSh ${parseFloat(item.price).toLocaleString()}`;
    document.getElementById('modalCondition').innerText = item.condition ||item.item_condition|| "Gently Used";
    document.getElementById('modalLocation').innerText = item.location;
    document.getElementById('modalSeller').innerText = item.seller_name || 'Verified Member';
    
    document.getElementById('modalDescription').innerText = item.description && item.description.trim() !== ""
        ? item.description 
        : "The seller did not include an additional text description for this marketplace post.";

    // Configure WhatsApp hook
    const message = encodeURIComponent(`Hi! I just saw your full listing for "${item.title}" priced at KSh ${item.price} on RE-MARKET. Is it still available?`);
    document.getElementById('modalWhatsAppLink').href = `https://wa.me/${item.whatsapp_number}?text=${message}`;

    // Reveal modal layout
    document.getElementById('productModal').classList.remove('hidden');
}
//  8. CLOSE DETAILED PREVIEW MODAL
function closeProductModal() {
    document.getElementById('productModal').classList.add('hidden');
}