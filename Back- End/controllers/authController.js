const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';
const SALT_ROUNDS = 10;

exports.register = async (req, res) => {
    const { name, email, whatsapp_number, password } = req.body;

    if (!name || !email || !whatsapp_number || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email.trim().toLowerCase()]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ message: 'Email already registered.' });
        }

        const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
        const insertResult = await db.query(
            'INSERT INTO users (name, email, password_hash, whatsapp_number) VALUES ($1, $2, $3, $4) RETURNING id, name, email, whatsapp_number, role',
            [name.trim(), email.trim().toLowerCase(), password_hash, whatsapp_number.trim()]
        );

        const user = insertResult.rows[0];
        res.status(201).json({ message: 'Registration successful.', user });
    } catch (err) {
        console.error('Auth registration error:', err);
        res.status(500).json({ message: 'Registration failed.', error: err.message });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const result = await db.query('SELECT id, name, email, password_hash, whatsapp_number, role FROM users WHERE email = $1', [email.trim().toLowerCase()]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const matched = await bcrypt.compare(password, user.password_hash);
        if (!matched) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                whatsapp_number: user.whatsapp_number,
                role: user.role,
            },
        });
    } catch (err) {
        console.error('Auth login error:', err);
        res.status(500).json({ message: 'Login failed.', error: err.message });
    }
};
