require('dotenv').config({ path: require('node:path').resolve(__dirname, '../.env') });

const connectDatabase = require('./config/database');
const createApp = require('./app');

async function start() {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
        throw new Error('JWT_SECRET must contain at least 32 characters.');
    }

    await connectDatabase(process.env.MONGODB_URI);
    const port = Number(process.env.PORT) || 3000;
    createApp().listen(port, () => {
        console.log(`TraffIQ API listening on port ${port}.`);
    });
}

start().catch((error) => {
    console.error('Unable to start TraffIQ API:', error.message);
    process.exitCode = 1;
});
