const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createToken(userId) {
    return jwt.sign({}, process.env.JWT_SECRET, {
        subject: userId.toString(),
        expiresIn: '7d'
    });
}

function publicUser(user) {
    return { id: user.id, name: user.name, email: user.email };
}

async function signup(req, res, next) {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (name.length < 2 || name.length > 80 || !emailPattern.test(email) || email.length > 254 || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
        return res.status(400).json({ error: 'Enter a name, valid email, and a password of 8-72 characters (maximum 72 UTF-8 bytes).' });
    }

    try {
        const existingUser = await User.exists({ email });
        if (existingUser) {
            return res.status(409).json({ error: 'An account with this email already exists.' });
        }

        const user = await User.create({
            name,
            email,
            passwordHash: await bcrypt.hash(password, 12)
        });

        res.status(201).json({ token: createToken(user.id), user: publicUser(user) });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ error: 'An account with this email already exists.' });
        }
        next(error);
    }
}

async function login(req, res, next) {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        const user = await User.findOne({ email }).select('+passwordHash');
        if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
            return res.status(401).json({ error: 'Invalid credentials. Check your email and password.' });
        }

        res.json({ token: createToken(user.id), user: publicUser(user) });
    } catch (error) {
        next(error);
    }
}

function me(req, res, next) {
    User.findById(req.userId)
        .then((user) => {
            if (!user) return res.status(404).json({ error: 'Account not found.' });
            res.json({ user: publicUser(user) });
        })
        .catch(next);
}

module.exports = { signup, login, me };
