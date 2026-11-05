const mongoose = require('mongoose');

async function connectDatabase(uri) {
    if (!uri) {
        throw new Error('MONGODB_URI is required.');
    }

    await mongoose.connect(uri);
    console.log('Connected to MongoDB.');
}

module.exports = connectDatabase;
