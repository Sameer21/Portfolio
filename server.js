const http = require('http');
const { randomUUID } = require('crypto');
const fs = require('fs/promises');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;
const MESSAGES_FILE = process.env.CONTACT_MESSAGES_FILE || path.join(__dirname, 'data', 'contact-messages.json');
const DATA_DIR = path.dirname(MESSAGES_FILE);
const blockedStaticFiles = new Set(['server.js', 'package.json', 'package-lock.json', 'README.md']);

const contentTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg'
};

const server = http.createServer(async (req, res) => {
    try {
        if (req.method === 'POST' && req.url === '/api/contact') {
            await handleContactSubmission(req, res);
            return;
        }

        if (req.method === 'GET') {
            await serveStaticFile(req, res);
            return;
        }

        sendJson(res, 405, { error: 'Method not allowed' });
    } catch (error) {
        if (error.statusCode) {
            sendJson(res, error.statusCode, { error: error.message });
            return;
        }

        console.error(error);
        sendJson(res, 500, { error: 'Internal server error' });
    }
});

async function handleContactSubmission(req, res) {
    const body = await readJsonBody(req);
    const submission = validateSubmission(body);

    await fs.mkdir(DATA_DIR, { recursive: true });
    const messages = await readMessages();

    messages.push({
        id: randomUUID(),
        ...submission,
        createdAt: new Date().toISOString()
    });

    await fs.writeFile(MESSAGES_FILE, JSON.stringify(messages, null, 2));
    sendJson(res, 201, { ok: true, message: 'Message saved' });
}

function readJsonBody(req) {
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

async function readMessages() {
    try {
        const file = await fs.readFile(MESSAGES_FILE, 'utf8');
        return JSON.parse(file);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }

        throw error;
    }
}

async function serveStaticFile(req, res) {
    const requestedPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
    const relativePath = requestedPath === '/' ? 'index.html' : requestedPath.replace(/^\/+/, '');
    const filePath = path.normalize(path.join(PUBLIC_DIR, relativePath));
    const pathSegments = relativePath.split(/[\\/]+/);

    if (
        !filePath.startsWith(PUBLIC_DIR) ||
        filePath.includes(`${path.sep}data${path.sep}`) ||
        pathSegments.some((segment) => segment.startsWith('.')) ||
        blockedStaticFiles.has(path.basename(filePath))
    ) {
        sendText(res, 403, 'Forbidden');
        return;
    }

    try {
        const file = await fs.readFile(filePath);
        res.writeHead(200, {
            'Content-Type': contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream'
        });
        res.end(file);
    } catch (error) {
        if (error.code === 'ENOENT' || error.code === 'EISDIR') {
            sendText(res, 404, 'Not found');
            return;
        }

        throw error;
    }
}

function sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(payload));
}

function sendText(res, statusCode, message) {
    res.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(message);
}

function createHttpError(statusCode, message) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

server.listen(PORT, () => {
    console.log(`Portfolio server running at http://localhost:${PORT}`);
    console.log(`Contact messages will be stored in ${MESSAGES_FILE}`);
});
