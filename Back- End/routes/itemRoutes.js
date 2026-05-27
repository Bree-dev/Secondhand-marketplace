const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const protect = require('../middleware/authMiddleware');

// Public route: Anyone can browse the feed, search, and click WhatsApp links
router.get('/', itemController.getAllItems); // Matches: GET /api/items

// Private route: Only logged-in accounts can insert new data records
router.post('/create', protect, itemController.createItem); // Matches: POST /api/items/create
// Secure endpoint: Authenticates the user first, then proceeds to the controller
router.delete('/:id', authMiddleware, itemController.deleteItem);
module.exports = router;