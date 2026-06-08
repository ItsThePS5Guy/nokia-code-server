const http = require('http');

const PORT = process.env.PORT || 3000;
const urlDatabase = {};
const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function generateShortCode() {
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += BASE58_ALPHABET[Math.floor(Math.random() * BASE58_ALPHABET.length)];
    }
    return code;
}

const server = http.createServer((req, res) => {
    // Modern WHATWG URL API (No warnings)
    const baseURL = `http://${req.headers.host}`;
    const parsedUrl = new URL(req.url, baseURL);
    const path = parsedUrl.pathname;

    // ---------------------------------------------------------
    // 1. THE PC INTERFACE (GET /)
    // ---------------------------------------------------------
    if (req.method === 'GET' && path === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>PC: Create Link Code</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: auto; }
                    input[type="url"] { width: 100%; padding: 10px; margin-bottom: 10px; font-size: 16px; }
                    button { padding: 10px 20px; font-size: 16px; cursor: pointer; }
                </style>
            </head>
            <body>
                <h2>Create a Phone Code</h2>
                <form action="/generate" method="POST">
                    <label>Paste Long URL:</label><br><br>
                    <input type="url" name="longUrl" required placeholder="https://..." />
                    <button type="submit">Generate 6-Digit Code</button>
                </form>
            </body>
            </html>
        `);
    }
    // ---------------------------------------------------------
    // 2. THE GENERATOR LOGIC (POST /generate)
    // ---------------------------------------------------------
    else if (req.method === 'POST' && path === '/generate') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            const params = new URLSearchParams(body);
            const longUrl = params.get('longUrl');
            
            let code;
            do {
                code = generateShortCode();
            } while (urlDatabase[code]); 

            urlDatabase[code] = longUrl;

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
                <!DOCTYPE html>
                <html>
                <head><title>Code Generated</title><style>body { font-family: Arial; padding: 40px; text-align: center; }</style></head>
                <body>
                    <h2>Success!</h2>
                    <p>Your URL is saved. On your Nokia, go to this website and enter:</p>
                    <h1 style="font-size: 48px; letter-spacing: 5px;">${code}</h1>
                    <a href="/">Create another</a> | <a href="/phone">View Phone Interface</a>
                </body>
                </html>
            `);
        });
    }
    // ---------------------------------------------------------
    // 3. THE NOKIA 110 INTERFACE (GET /phone)
    // ---------------------------------------------------------
    else if (req.method === 'GET' && path === '/phone') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Go</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
            </head>
            <body>
                <h3>Enter Code:</h3>
                <form action="/redirect" method="GET">
                    <input type="text" name="c" maxlength="6" required />
                    <br><br>
                    <input type="submit" value="Go!" />
                </form>
            </body>
            </html>
        `);
    }
    // ---------------------------------------------------------
    // 4. THE REDIRECTOR LOGIC (GET /redirect)
    // ---------------------------------------------------------
    else if (req.method === 'GET' && path === '/redirect') {
        const code = parsedUrl.searchParams.get('c'); 
        const longUrl = urlDatabase[code];

        if (longUrl) {
            res.writeHead(301, { Location: longUrl });
            res.end();
        } else {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('Invalid code. <a href="/phone">Try again</a>');
        }
    } 
    // 404 Fallback
    else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Page not found');
    }
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
