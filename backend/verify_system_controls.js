const http = require('http');

function request(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, body }));
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function verify() {
    try {
        console.log('Logging in...');
        const loginData = JSON.stringify({ username: 'root', password: 'root' });
        const loginRes = await request({
            hostname: '127.0.0.1',
            port: 3001,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': loginData.length
            }
        }, loginData);

        if (loginRes.statusCode !== 200) {
            throw new Error(`Login failed: ${loginRes.statusCode} ${loginRes.body}`);
        }
        const token = JSON.parse(loginRes.body).token;
        console.log('Login successful.');

        // 1. Get Initial Status
        console.log('Fetching initial status...');
        const statusRes = await request({
            hostname: '127.0.0.1',
            port: 3001,
            path: '/api/audit-logs/status',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const initialStatus = JSON.parse(statusRes.body).enabled;
        console.log('Initial Status:', initialStatus);

        // 2. Toggle Status (Disable)
        console.log('Disabling audit service...');
        const toggleRes = await request({
            hostname: '127.0.0.1',
            port: 3001,
            path: '/api/audit-logs/status',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Content-Length': JSON.stringify({ enabled: false }).length
            }
        }, JSON.stringify({ enabled: false }));

        if (toggleRes.statusCode !== 200) throw new Error(`Failed to disable service: ${toggleRes.statusCode} ${toggleRes.body}`);
        console.log('Service disabled.');

        // 3. Verify Status is False
        const statusRes2 = await request({
            hostname: '127.0.0.1',
            port: 3001,
            path: '/api/audit-logs/status',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (JSON.parse(statusRes2.body).enabled !== false) throw new Error('Status verification failed (expected false)');
        console.log('Status verified: False');

        // 4. Clear Cache
        console.log('Clearing cache...');
        const cacheRes = await request({
            hostname: '127.0.0.1',
            port: 3001,
            path: '/api/audit-logs/cache/clear',
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (cacheRes.statusCode !== 200) throw new Error('Failed to clear cache');
        console.log('Cache cleared.');

        // 5. Toggle Status Back (Enable)
        console.log('Enabling audit service...');
        await request({
            hostname: '127.0.0.1',
            port: 3001,
            path: '/api/audit-logs/status',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Content-Length': JSON.stringify({ enabled: true }).length
            }
        }, JSON.stringify({ enabled: true }));
        console.log('Service enabled.');

        console.log('SUCCESS: System controls verified.');

    } catch (err) {
        console.log('ERROR:', err.message);
        if (err.cause) console.log(err.cause);
    }
}

verify();
