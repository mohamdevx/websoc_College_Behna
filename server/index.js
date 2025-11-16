import express from 'express';
import { WebSocketServer } from 'ws';

const app = express();
const DEFAULT_PORT = Number(process.env.PORT) || 8000;

// Start server with automatic retry on EADDRINUSE by trying the next port.
function startServer(portToTry, attemptsLeft = 5) {
  const server = app.listen(portToTry);

  const onListening = () => {
    console.log(`server is listening on port ${portToTry}`);

    const wss = new WebSocketServer({ server });
    wss.on('connection', (ws) => {
      ws.on('message', (data) => {
        console.log('data from client :', data.toString());
        ws.send('thanks buddy');
      });
    });

    // handle errors coming from the WebSocket server
    wss.on('error', (err) => {
      console.error('WebSocketServer error:', err);
    });
  };

  const onError = (err) => {
    if (err && err.code === 'EADDRINUSE') {
      console.warn(`Port ${portToTry} in use, trying port ${portToTry + 1}...`);
      // close the server and try next port
      server.close(() => {
        startServer(portToTry + 1, attemptsLeft - 1);
      });
    } else {
      console.error('Server failed to start:', err);
      process.exit(1);
    }
  };

  server.once('listening', onListening);
  server.once('error', onError);
}
// Allow overriding the port with an environment variable so you can run multiple
// servers locally (e.g. PORT=8001 node index.js).
startServer(DEFAULT_PORT);
