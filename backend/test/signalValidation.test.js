const test = require('node:test');
const assert = require('node:assert/strict');
const SignalSettings = require('../src/models/SignalSettings');
const {
    validateSignals,
    saveSignals,
    getSignal,
    updateSignal,
    deleteSignal
} = require('../src/controllers/signalController');

function createResponse() {
    return {
        statusCode: undefined,
        body: undefined,
        status(statusCode) {
            this.statusCode = statusCode;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        }
    };
}

test('accepts a valid signal settings list', () => {
    assert.equal(validateSignals([{
        id: 's1',
        lat: 30.749,
        lon: 76.77,
        cycle: [30, 5, 25, 5],
        phaseOffset: 0,
        isManual: false,
        manualState: null
    }]), true);
});

test('rejects invalid IDs, cycles, and more than 40 signals', () => {
    const valid = {
        id: 's1',
        lat: 30.749,
        lon: 76.77,
        cycle: [30, 5, 25, 5],
        isManual: false,
        manualState: null
    };

    assert.equal(validateSignals([{ ...valid, id: 's41' }]), false);
    assert.equal(validateSignals([{ ...valid, cycle: [0, 5, 25, 5] }]), false);
    assert.equal(validateSignals([{ ...valid, phaseOffset: 65 }]), false);
    assert.equal(validateSignals([{ ...valid }, { ...valid }]), false);
    assert.equal(validateSignals(Array.from({ length: 41 }, (_, index) => ({ ...valid, id: `s${(index % 40) + 1}` }))), false);
});

test('saves signal coordinates under the authenticated user', async (t) => {
    const originalFindOneAndUpdate = SignalSettings.findOneAndUpdate;
    let updateArguments;
    SignalSettings.findOneAndUpdate = async (...args) => {
        updateArguments = args;
    };
    t.after(() => {
        SignalSettings.findOneAndUpdate = originalFindOneAndUpdate;
    });

    const userId = 'authenticated-user-id';
    const signal = {
        id: 's1',
        lat: 30.75,
        lon: 76.78,
        cycle: [30, 5, 25, 5],
        phaseOffset: 0,
        isManual: false,
        manualState: null
    };
    let responseStatus;
    let responseBody;
    const response = {
        status(status) {
            responseStatus = status;
            return this;
        },
        json(body) {
            responseBody = body;
            return this;
        }
    };

    await saveSignals({ userId, body: { signals: [signal] } }, response, (error) => {
        throw error;
    });

    assert.deepEqual(updateArguments[0], { userId });
    assert.deepEqual(updateArguments[1].$set.signals, [signal]);
    assert.equal(responseStatus, undefined);
    assert.deepEqual(responseBody, { message: 'Signal settings saved.', count: 1 });
});

test('gets one signal from the authenticated user settings', async (t) => {
    const originalFindOne = SignalSettings.findOne;
    const signal = {
        id: 's1',
        lat: 30.749,
        lon: 76.77,
        cycle: [30, 5, 25, 5],
        phaseOffset: 0,
        isManual: false,
        manualState: null
    };
    let query;
    SignalSettings.findOne = (filter) => {
        query = filter;
        return { lean: async () => ({ signals: [signal] }) };
    };
    t.after(() => {
        SignalSettings.findOne = originalFindOne;
    });

    const response = createResponse();
    await getSignal({ userId: 'authenticated-user-id', params: { id: 's1' } }, response, assert.fail);

    assert.deepEqual(query, { userId: 'authenticated-user-id' });
    assert.deepEqual(response.body, { signal });
});

test('patches one signal for the authenticated user', async (t) => {
    const originalFindOne = SignalSettings.findOne;
    const originalFindOneAndUpdate = SignalSettings.findOneAndUpdate;
    const signal = {
        id: 's1',
        lat: 30.749,
        lon: 76.77,
        cycle: [30, 5, 25, 5],
        phaseOffset: 0,
        isManual: false,
        manualState: null
    };
    let updateArguments;
    SignalSettings.findOne = () => ({ lean: async () => ({ signals: [signal] }) });
    SignalSettings.findOneAndUpdate = async (...args) => {
        updateArguments = args;
        return { signals: [args[1].$set['signals.$']] };
    };
    t.after(() => {
        SignalSettings.findOne = originalFindOne;
        SignalSettings.findOneAndUpdate = originalFindOneAndUpdate;
    });

    const response = createResponse();
    await updateSignal({
        userId: 'authenticated-user-id',
        params: { id: 's1' },
        body: { lat: 30.75, lon: 76.78 }
    }, response, assert.fail);

    assert.deepEqual(updateArguments[0], { userId: 'authenticated-user-id', 'signals.id': 's1' });
    assert.equal(updateArguments[1].$set['signals.$'].lat, 30.75);
    assert.deepEqual(response.body.signal, { ...signal, lat: 30.75, lon: 76.78 });
});

test('deletes one signal only from the authenticated user settings', async (t) => {
    const originalFindOneAndUpdate = SignalSettings.findOneAndUpdate;
    let updateArguments;
    SignalSettings.findOneAndUpdate = async (...args) => {
        updateArguments = args;
        return { signals: [] };
    };
    t.after(() => {
        SignalSettings.findOneAndUpdate = originalFindOneAndUpdate;
    });

    const response = createResponse();
    await deleteSignal({
        userId: 'authenticated-user-id',
        params: { id: 's1' }
    }, response, assert.fail);

    assert.deepEqual(updateArguments[0], { userId: 'authenticated-user-id', 'signals.id': 's1' });
    assert.deepEqual(updateArguments[1], { $pull: { signals: { id: 's1' } } });
    assert.deepEqual(response.body, { message: 'Signal settings deleted.', id: 's1' });
});
