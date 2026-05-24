const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3000;
const path = require('path');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let watchlist = [
    'https://www.google.com',
    'https://www.github.com'
];

let statusTracker = {};
watchlist.forEach(url => statusTracker[url] = { isUp: true, reason: '200 OK' });

async function checkSingleLink(url) {
    try {
        const response = await axios.head(url, { timeout: 5000 });
        const isUp = response.status >= 200 && response.status < 400;

        if (!statusTracker[url]) statusTracker[url] = { isUp: false, reason: 'Initializing' };
        statusTracker[url] = { isUp: true, reason: `HTTP ${response.status}` };
    } catch (error) {
        let reason = 'Offline';
        if (error.response) {
            reason = `HTTP ${error.response.status}`;
        } else if (error.code === 'ECONNABORTED') {
            reason = 'Timeout (>5s)';
        } else if (error.code) {
            reason = error.code;
        }
        statusTracker[url] = { isUp: false, reason: reason };
    }
}

async function monitorPipeline() {
    const tasks = watchlist.map(url => checkSingleLink(url));
    await Promise.all(tasks);
}

setInterval(monitorPipeline, 10000);
monitorPipeline();

// --- NEW FAVICON ROUTE ---
// Serves a globe emoji as an SVG icon for the browser tab so you don't need a local file
// --- CUSTOM TAB ICON ROUTE ---
app.get('/favicon.ico', (req, res) => {
    // This sends your exact image straight to the browser tab
    res.sendFile(path.join(__dirname, 'favi.jpeg'));
});

// --- UPDATED DASHBOARD ROUTE WITH NEW DESIGN ---
app.get('/', (req, res) => {
    const rows = watchlist.map(url => {
        const status = statusTracker[url] || { isUp: true, reason: 'Pending...' };
        const statusClass = status.isUp ? 'status-up' : 'status-down';
        const statusText = status.isUp ? '🟢 Online' : '🔴 Offline';
        
        return `
            <tr>
                <td class="url-text">${url}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td class="reason-text">${status.reason}</td>
            </tr>
        `;
    }).join('');

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Link Monitor Dashboard</title>
        
        <link rel="icon" type="image/jpeg" href="/favicon.ico">

        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
        
        <style>
            :root {
                --bg-color: #0b0f19;
                --card-bg: #151d30;
                --text-main: #f3f4f6;
                --text-muted: #9ca3af;
                --gradient-start: #06b6d4; /* Cyan */
                --gradient-end: #10b981;   /* Emerald Green */
            }

            body { 
                font-family: 'Roboto', sans-serif; 
                background-color: var(--bg-color); 
                margin: 0;
                padding: 40px 20px; 
                color: var(--text-main); 
                display: flex;
                justify-content: center;
            }

            .container { 
                width: 100%;
                max-width: 850px; 
                background: var(--card-bg); 
                padding: 40px; 
                border-radius: 16px; 
                box-shadow: 0 10px 25px rgba(0,0,0,0.3);
                border: 1px solid #24324f;
            }

            /* Gradient Title styling */
            h1 { 
                margin-top: 0; 
                font-size: 2.5rem;
                font-weight: 700;
                background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                letter-spacing: -0.5px;
            }

            p {
                color: var(--text-muted);
                font-weight: 300;
                margin-bottom: 30px;
                font-size: 1.05rem;
            }

            /* Sleek Input Fields */
            .form-group { 
                display: flex; 
                gap: 12px; 
                margin-bottom: 35px; 
            }

            input[type="url"] { 
                flex: 1; 
                padding: 14px 20px; 
                background: #1e293b;
                border: 1px solid #334155; 
                border-radius: 8px; 
                font-size: 16px; 
                color: white;
                font-family: 'Roboto', sans-serif;
                transition: border-color 0.2s;
            }

            input[type="url"]:focus {
                outline: none;
                border-color: var(--gradient-start);
            }

            /* Gradient Button */
            button { 
                background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
                color: #0b0f19; 
                border: none; 
                padding: 14px 28px; 
                border-radius: 8px; 
                font-weight: 700; 
                cursor: pointer; 
                font-size: 16px; 
                font-family: 'Roboto', sans-serif;
                transition: opacity 0.2s, transform 0.1s;
            }

            button:hover { 
                opacity: 0.95; 
            }
            button:active {
                transform: scale(0.98);
            }

            /* Refactored Dark Dashboard Table */
            table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-top: 10px; 
            }

            th, td { 
                text-align: left; 
                padding: 16px; 
                border-bottom: 1px solid #24324f; 
            }

            th { 
                background: #111827; 
                font-weight: 500; 
                color: var(--text-muted);
                text-transform: uppercase;
                font-size: 0.85rem;
                letter-spacing: 0.5px;
            }

            .url-text {
                font-weight: 400;
                color: #e5e7eb;
            }

            .reason-text {
                color: var(--text-muted);
                font-family: monospace;
                font-size: 0.9rem;
            }

            /* Custom Status Badges */
            .status-badge { 
                padding: 6px 12px; 
                border-radius: 20px; 
                font-size: 13px; 
                font-weight: 500; 
            }

            .status-up { 
                background: rgba(16, 185, 129, 0.15); 
                color: #34d399; 
                border: 1px solid rgba(16, 185, 129, 0.3);
            }

            .status-down { 
                background: rgba(239, 68, 68, 0.15); 
                color: #f87171; 
                border: 1px solid rgba(239, 68, 68, 0.3);
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Link Monitor</h1>
            <p>Enter a website URL below to track live availability network updates.</p>
            
            <form action="/add-link" method="POST" class="form-group">
                <input type="url" name="url" placeholder="https://example.com" required>
                <button type="submit">Add Target</button>
            </form>

            <table>
                <thead>
                    <tr>
                        <th>Target Web Address</th>
                        <th>Status</th>
                        <th>Ping Response</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
        <script>
            setTimeout(() => { location.reload(); }, 10000);
        </script>
    </body>
    </html>
    `;
    res.send(html);
});

app.post('/add-link', async (req, res) => {
    let newUrl = req.body.url.trim();
    if (newUrl && !watchlist.includes(newUrl)) {
        watchlist.push(newUrl);
        statusTracker[newUrl] = { isUp: true, reason: 'Checking...' };
        await checkSingleLink(newUrl);
    }
    res.redirect('/');
});

app.listen(PORT, () => {
    console.log(`🚀 Dashboard UI ready at http://localhost:${PORT}`);
});