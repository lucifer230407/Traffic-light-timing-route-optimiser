const test = require('node:test');
const assert = require('node:assert/strict');
const User = require('../src/models/User');
const { login } = require('../src/controllers/authController');

test('login rejects an account without a password hash without returning a server error', async (t) => {
    const originalFindOne = User.findOne;
    User.findOne = () => ({
        select: async () => ({ passwordHash: undefined })
    });
    t.after(() => {
        User.findOne = originalFindOne;
    });

    let status;
    let payload;
    let nextError;
    const response = {
        status(code) {
            status = code;
            return this;
        },
        json(body) {
            payload = body;
            return this;
        }
    };

    await login(
        { body: { email: 'user@example.com', password: 'valid-password' } },
        response,
        (error) => {
            nextError = error;
        }
    );

    assert.equal(status, 401);
    assert.deepEqual(payload, { error: 'Invalid credentials. Check your email and password.' });
    assert.equal(nextError, undefined);
});
