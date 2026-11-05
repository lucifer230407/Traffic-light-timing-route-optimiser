const path = require('node:path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('./routes/authRoutes');
const signalRoutes = require('./routes/signalRoutes');

function createApp() {
    const app = express();
    app.set('trust proxy', 1);
    const allowedOrigins = (process.env.CLIENT_ORIGIN || '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);

    app.use(helmet({
        crossOriginEmbedderPolicy: false,
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", 'https://unpkg.com'],
                styleSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com', 'https://cdn.jsdelivr.net', 'https://fonts.googleapis.com'],
                fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com', 'https://cdn.jsdelivr.net'],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'", 'https://unpkg.com']
            }
        }
    }));
    app.use((req, res, next) => {
        const requestOrigin = req.get('origin');
        const sameOrigin = requestOrigin === `${req.protocol}://${req.get('host')}`;

        cors({
            origin(origin, callback) {
                if (!origin || sameOrigin || allowedOrigins.includes(origin)) return callback(null, true);
                const error = new Error('Origin is not allowed by CORS.');
                error.status = 403;
                return callback(error);
            }
        })(req, res, next);
    });
    app.use(express.json({ limit: '64kb' }));

    app.get('/api/health', (req, res) => {
        res.json({ status: 'ok' });
    });
    app.use('/api/auth', authRoutes);
    app.use('/api/signals', signalRoutes);

    const frontendRoot = path.resolve(__dirname, '../../frontend');
    app.use('/css', express.static(path.join(frontendRoot, 'css')));
    app.use('/js', express.static(path.join(frontendRoot, 'js')));
    app.get('/traffic_hero.png', (req, res) => res.sendFile(path.join(frontendRoot, 'traffic_hero.png')));
    app.get('/', (req, res) => res.sendFile(path.join(frontendRoot, 'index.html')));

    app.use((req, res) => res.status(404).json({ error: 'Not found.' }));
    app.use((error, req, res, next) => {
        if (res.headersSent) return next(error);
        const status = error.status || 500;
        if (status >= 500) console.error(error);
        res.status(status).json({
            error: status < 500 ? error.message : 'An unexpected server error occurred.'
        });
    });

    return app;
}

module.exports = createApp;
