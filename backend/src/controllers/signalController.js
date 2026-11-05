const SignalSettings = require('../models/SignalSettings');

const signalIdPattern = /^s([1-9]|[1-3]\d|40)$/;

function validateSignals(signals) {
    if (!Array.isArray(signals) || signals.length > 40) return false;

    const ids = new Set();
    return signals.every((signal) => {
        if (!signal || typeof signal.id !== 'string' || !signalIdPattern.test(signal.id) || ids.has(signal.id)) {
            return false;
        }
        ids.add(signal.id);

        return Number.isFinite(signal.lat)
            && signal.lat >= -90 && signal.lat <= 90
            && Number.isFinite(signal.lon)
            && signal.lon >= -180 && signal.lon <= 180
            && Array.isArray(signal.cycle)
            && signal.cycle.length === 4
            && signal.cycle.every((seconds) => Number.isInteger(seconds) && seconds >= 1 && seconds <= 300)
            && Number.isFinite(signal.phaseOffset)
            && signal.phaseOffset >= 0
            && signal.phaseOffset < signal.cycle.reduce((total, seconds) => total + seconds, 0)
            && typeof signal.isManual === 'boolean'
            && (signal.manualState === null || ['green', 'yellow', 'red'].includes(signal.manualState))
            && (!signal.isManual || signal.manualState !== null);
    });
}

function getSignal(req, res, next) {
    if (!signalIdPattern.test(req.params.id)) {
        return res.status(400).json({ error: 'Signal ID must be between s1 and s40.' });
    }

    SignalSettings.findOne({ userId: req.userId })
        .lean()
        .then((settings) => {
            const signal = settings?.signals.find((item) => item.id === req.params.id);
            if (!signal) return res.status(404).json({ error: 'Signal settings not found.' });
            res.json({ signal });
        })
        .catch(next);
}

async function getSignals(req, res, next) {
    try {
        const settings = await SignalSettings.findOne({ userId: req.userId }).lean();
        res.json({ signals: settings ? settings.signals : [] });
    } catch (error) {
        next(error);
    }
}

async function saveSignals(req, res, next) {
    const signals = req.body.signals;
    if (!validateSignals(signals)) {
        return res.status(400).json({ error: 'Signal settings are invalid or exceed the 40-signal limit.' });
    }

    try {
        await SignalSettings.findOneAndUpdate(
            { userId: req.userId },
            { $set: { signals } },
            { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
        );
        res.json({ message: 'Signal settings saved.', count: signals.length });
    } catch (error) {
        next(error);
    }
}

async function updateSignal(req, res, next) {
    const { id } = req.params;
    if (!signalIdPattern.test(id)) {
        return res.status(400).json({ error: 'Signal ID must be between s1 and s40.' });
    }

    const allowedFields = new Set(['lat', 'lon', 'cycle', 'phaseOffset', 'isManual', 'manualState']);
    const updates = req.body;
    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
        return res.status(400).json({ error: 'Signal updates must be a JSON object.' });
    }
    const fields = Object.keys(updates);
    if (!fields.length || fields.some((field) => !allowedFields.has(field))) {
        return res.status(400).json({ error: 'Provide one or more valid signal fields to update.' });
    }

    try {
        const settings = await SignalSettings.findOne({ userId: req.userId }).lean();
        const existing = settings?.signals.find((signal) => signal.id === id);
        if (!existing) return res.status(404).json({ error: 'Signal settings not found.' });

        const signal = { ...existing, ...updates, id };
        if (!validateSignals([signal])) {
            return res.status(400).json({ error: 'Signal settings are invalid.' });
        }

        const updated = await SignalSettings.findOneAndUpdate(
            { userId: req.userId, 'signals.id': id },
            { $set: { 'signals.$': signal } },
            { new: true, runValidators: true }
        );
        if (!updated) return res.status(404).json({ error: 'Signal settings not found.' });

        res.json({
            message: 'Signal settings updated.',
            signal: updated.signals.find((item) => item.id === id)
        });
    } catch (error) {
        next(error);
    }
}

async function deleteSignal(req, res, next) {
    const { id } = req.params;
    if (!signalIdPattern.test(id)) {
        return res.status(400).json({ error: 'Signal ID must be between s1 and s40.' });
    }

    try {
        const updated = await SignalSettings.findOneAndUpdate(
            { userId: req.userId, 'signals.id': id },
            { $pull: { signals: { id } } },
            { new: true }
        );
        if (!updated) return res.status(404).json({ error: 'Signal settings not found.' });

        res.json({ message: 'Signal settings deleted.', id });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getSignal,
    getSignals,
    saveSignals,
    updateSignal,
    deleteSignal,
    validateSignals
};
