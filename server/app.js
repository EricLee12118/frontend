import http from 'http';
import { Server } from 'socket.io';
import next from 'next';
import logger from './config/logger.js';
import EventBroadcaster from './services/EventBroadcaster.js';
import authMiddleware from './middleware/auth.js';
import initializeSocketHandlers from './handlers/socketHandlers.js';

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
    const httpServer = http.createServer((req, res) => handle(req, res));
    const io = new Server(httpServer, {
        cors: {
            origin: dev ? 'http://localhost:3000' : 'http://172.24.32.171:3000',
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    const eventBroadcaster = new EventBroadcaster(io);
    
    io.use(authMiddleware(io));

    io.on('connection', (socket) => {
        initializeSocketHandlers(io, socket, eventBroadcaster);
    });

    const PORT = process.env.PORT || 3000;
    httpServer.listen(PORT, () => {
        logger.info(`Next.js and Socket.io server is running on port ${PORT}`);
    });
});