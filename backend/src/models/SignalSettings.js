const mongoose = require('mongoose');

const signalSchema = new mongoose.Schema({
    id: { type: String, required: true },
    lat: { type: Number, required: true, min: -90, max: 90 },
    lon: { type: Number, required: true, min: -180, max: 180 },
    cycle: {
        type: [Number],
        required: true,
        validate: {
            validator: (cycle) => cycle.length === 4 && cycle.every((seconds) => Number.isInteger(seconds) && seconds >= 1 && seconds <= 300),
            message: 'Each signal cycle must contain four durations between 1 and 300 seconds.'
        }
    },
    phaseOffset: { type: Number, default: 0, min: 0 },
    isManual: { type: Boolean, default: false },
    manualState: { type: String, enum: ['green', 'yellow', 'red', null], default: null }
}, { _id: false });

const signalSettingsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    signals: {
        type: [signalSchema],
        default: []
    }
}, { timestamps: true });

module.exports = mongoose.model('SignalSettings', signalSettingsSchema);
