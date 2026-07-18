const { randomUUID } = require('crypto');

const MESSAGE_KEY = 'portfolio:contact-messages';

module.exports = async function handler(req, res) {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
    }

    if (req.method !== 'POST') {
        sendJson(res, 405, { error: 'Method not allowed' });
        return;
    }

    try {
        const body = await readBody(req);
        const submission = validateSubmission(body);

        await saveToUpstash({
            id: randomUUID(),
            ...submission,
            createdAt: new Date().toISOString()
        });

        sendJson(res, 201, { ok: true, message: 'Message saved' });
    } catch (error) {
        if (error.statusCode) {
            sendJson(res, error.statusCode, { error: error.message });
            return;
        }

        console.error(error);
        sendJson(res, 500, { error: 'Unable to save message right now.' });
    }
};

function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function readBody(req) {
    if (req.body && typeof req.body === 'object') {
        return req.body;
    }

    if (typeof req.body === 'string') {
        return JSON.parse(req.body || '{}');
    }

    return new Promise((resolve, reject) => {
        let body = '';

        req.on('data', (chunk) => {
            body += chunk;

            if (body.length > 1024 * 1024) {
                req.destroy();
                reject(createHttpError(413, 'Request body too large'));
            }
        });

        req.on('end', () => {
            try {
                resolve(JSON.parse(body || '{}'));
            } catch (error) {
                reject(createHttpError(400, 'Invalid JSON'));
            }
        });

        req.on('error', reject);
    });
}

function validateSubmission(body) {
    const name = cleanField(body.name, 100);
    const email = cleanField(body.email, 150);
    const subject = cleanField(body.subject, 150);
    const message = cleanField(body.message, 2000);

    if (!name || !email || !subject || !message) {
        throw createHttpError(400, 'Please fill in every field.');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw createHttpError(400, 'Please enter a valid email address.');
    }

    return { name, email, subject, message };
}

function cleanField(value, maxLength) {
    return String(value || '').trim().slice(0, maxLength);
}

async function saveToUpstash(message) {
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

    if (!url || !token) {
        throw createHttpError(500, 'Contact storage is not configured.');
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(['LPUSH', MESSAGE_KEY, JSON.stringify(message)])
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.error) {
        throw new Error(result.error || 'Upstash request failed.');
    }
}

function sendJson(res, statusCode, payload) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(payload));
}

function createHttpError(statusCode, message) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}
