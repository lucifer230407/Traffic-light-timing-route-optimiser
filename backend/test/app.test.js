const test = require('node:test');
const assert = require('node:assert/strict');
const createApp = require('../src/app');

test('health endpoint and frontend are available without exposing protected settings', async (t) => {
    const server = createApp().listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    t.after(() => new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
    }));

    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}`;

    const health = await fetch(`${baseUrl}/api/health`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { status: 'ok' });
    assert.match(
        health.headers.get('content-security-policy'),
        /connect-src 'self' https:\/\/unpkg\.com/
    );

    const frontend = await fetch(baseUrl);
    assert.equal(frontend.status, 200);
    assert.match(await frontend.text(), /js\/api\.js/);

    const frontendScript = await fetch(`${baseUrl}/js/api.js`);
    assert.equal(frontendScript.status, 200);

    const mapScript = await fetch(`${baseUrl}/js/map.js`);
    assert.equal(mapScript.status, 200);
    assert.match(await mapScript.text(), /https:\/\/\{s\}\.tile\.openstreetmap\.org/);

    const backendSource = await fetch(`${baseUrl}/backend/src/server.js`);
    assert.equal(backendSource.status, 404);

    const protectedSettings = await fetch(`${baseUrl}/api/signals`);
    assert.equal(protectedSettings.status, 401);

    const sameOriginSettings = await fetch(`${baseUrl}/api/signals`, {
        headers: { Origin: baseUrl }
    });
    assert.equal(sameOriginSettings.status, 401);
    assert.equal(sameOriginSettings.headers.get('access-control-allow-origin'), baseUrl);

    const untrustedOrigin = await fetch(`${baseUrl}/api/signals`, {
        headers: { Origin: 'https://untrusted.example' }
    });
    assert.equal(untrustedOrigin.status, 403);
});
