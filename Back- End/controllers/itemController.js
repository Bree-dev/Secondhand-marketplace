const db = require('../config/db');

// 1. POST A NEW ITEM (Seller Action)
exports.createItem = async (req, res) => {
    // req.user comes directly from our upcoming auth middleware
    const seller_id = req.user.id; 
    const { title, description, category, condition, price, location, image_url } = req.body;

    try {
        const newItem = await db.query(
            `INSERT INTO items (seller_id, title, description, category, condition, price, location, image_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [seller_id, title, description, category, condition, price, location, image_url]
        );

        res.status(201).json({
            message: "Item listed successfully! 📦",
            item: newItem.rows[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to list item on database", error: err.message });
    }
};

// 2. GET ALL ITEMS WITH LIVE SEARCH & CATEGORY FILTERING (Buyer Feed)
exports.getAllItems = async (req, res) => {
    try {
        // 1. Extract query params sent by frontend app.js
        const { category, search } = req.query;

        // Base SQL string joining items with user details so we know the seller's name and phone
        let queryText = `
            SELECT items.*, users.name as seller_name, users.whatsapp_number 
            FROM items 
            JOIN users ON items.seller_id = users.id
        `;
        
        const queryParams = [];
        const whereClauses = [];

        // 2. Condition A: If filtering by a specific category (and it's not 'All')
        if (category && category !== 'All') {
            queryParams.push(category);
            whereClauses.push(`items.category = $${queryParams.length}`);
        }

        // 3. Condition B: If a user typed something into the search bar
        if (search) {
            queryParams.push(`%${search}%`); // Using SQL wildcards for partial matching
            // ILIKE makes the search case-insensitive in PostgreSQL (e.g., 'HP', 'hp', 'Hp' all match)
            whereClauses.push(`(items.title ILIKE $${queryParams.length} OR items.description ILIKE $${queryParams.length} OR items.location ILIKE $${queryParams.length})`);
        }

        // 4. If any conditions exist, stitch them into the main SQL text block
        if (whereClauses.length > 0) {
            queryText += ' WHERE ' + whereClauses.join(' AND ');
        }

        // Always sort items so the newest listings appear at the top of the feed
        queryText += ' ORDER BY items.created_at DESC';

        // 5. Fire off the structured dynamic query straight to PostgreSQL
        const result = await db.query(queryText, queryParams);
        
        res.json(result.rows);
    } catch (err) {
        console.error("Failed to execute database query filtering:", err);
        res.status(500).json({ message: "Server error fetching marketplace records." });
    }
};

exports.deleteItem = async (req, res) => {
    const itemId = req.params.id;
    const sellerId = req.user.id; // Extracted safely from the JWT token payload by authMiddleware

    try {
        // 1. Verify if the item exists and belongs to the authenticated user
        const itemCheck = await db.query('SELECT * FROM items WHERE id = $1', [itemId]);

        if (itemCheck.rows.length === 0) {
            return res.status(404).json({ message: "Item not found." });
        }

        if (itemCheck.rows[0].seller_id !== sellerId) {
            return res.status(403).json({ message: "Unauthorized! You can only delete your own listings." });
        }

        // 2. Perform the cascading deletion query
        await db.query('DELETE FROM items WHERE id = $1', [itemId]);
        
        res.json({ message: "Listing successfully removed from the marketplace. 🗑️" });
    } catch (err) {
        console.error("Database deletion error:", err);
        res.status(500).json({ message: "Internal server error during deletion process." });
    }
};