import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './database';
import versionsRouter from './routes/versions';
import docsRouter from './routes/docs';
import usefulDocsRouter from './routes/usefulDocs';
import manualsRouter from './routes/manuals';
import testPlansRouter from './routes/testPlans';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import uploadRouter from './routes/upload';
import uploadImageRouter from './routes/uploadImage';
import path from 'path';

import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Allow all origins for now, or restrict to frontend URL
        methods: ["GET", "POST"]
    }
});

const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.set('trust proxy', true);

// Socket.io Logic
interface UserSession {
    socketId: string;
    userId: number;
    username: string;
    currentPath: string;
    lastActivity: number;
    status: 'Active' | 'Inactive';
}

let activeSessions: UserSession[] = [];

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('join', (userData: { userId: number, username: string }) => {
        const existingSessionIndex = activeSessions.findIndex(s => s.userId === userData.userId);

        const newSession: UserSession = {
            socketId: socket.id,
            userId: userData.userId,
            username: userData.username,
            currentPath: '/',
            lastActivity: Date.now(),
            status: 'Active'
        };

        if (existingSessionIndex !== -1) {
            // Update existing session
            activeSessions[existingSessionIndex] = newSession;
        } else {
            activeSessions.push(newSession);
        }

        io.emit('users_update', activeSessions);
    });

    socket.on('update_activity', () => {
        const session = activeSessions.find(s => s.socketId === socket.id);
        if (session) {
            session.lastActivity = Date.now();
            if (session.status === 'Inactive') {
                session.status = 'Active';
                io.emit('users_update', activeSessions);
            }
        }
    });

    socket.on('route_change', (path: string) => {
        const session = activeSessions.find(s => s.socketId === socket.id);
        if (session) {
            session.currentPath = path;
            io.emit('users_update', activeSessions);
        }
    });

    socket.on('status_change', (status: 'Active' | 'Inactive') => {
        const session = activeSessions.find(s => s.socketId === socket.id);
        if (session) {
            session.status = status;
            io.emit('users_update', activeSessions);
        }
    });

    socket.on('disconnect', () => {
        activeSessions = activeSessions.filter(s => s.socketId !== socket.id);
        io.emit('users_update', activeSessions);
        console.log('Client disconnected:', socket.id);
    });
});

// Check for inactive users periodically (every 1 minute)
// Check for inactive users periodically (every 1 minute)
setInterval(() => {
    const now = Date.now();
    let changed = false;
    activeSessions.forEach(session => {
        if (session.status === 'Active' && (now - session.lastActivity > 5 * 60 * 1000)) { // 5 minutes inactive
            session.status = 'Inactive';
            changed = true;
        }
    });
    if (changed) {
        io.emit('users_update', activeSessions);
    }
}, 60000);

import changelogRouter from './routes/changelog';
import auditRoutes from './routes/audit';

app.use('/api/versions', versionsRouter);
app.use('/api/docs', docsRouter);
app.use('/api/useful-docs', usefulDocsRouter);
app.use('/api/manuals', manualsRouter);
app.use('/api/test-plans', testPlansRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/upload/image', uploadImageRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/changelog', changelogRouter);
app.use('/api/audit-logs', auditRoutes);

// Force logout endpoint
app.post('/api/users/:username/kick', (req, res) => {
    const { username } = req.params;
    const sessionsToKick = activeSessions.filter(s => s.username === username);

    if (sessionsToKick.length === 0) {
        res.status(404).json({ message: 'User not found or not online' });
        return;
    }

    sessionsToKick.forEach(session => {
        const socket = io.sockets.sockets.get(session.socketId);
        if (socket) {
            socket.disconnect(true);
        }
    });

    // Remove from active sessions
    activeSessions = activeSessions.filter(s => s.username !== username);
    io.emit('users_update', activeSessions);

    res.json({ message: `User ${username} has been kicked.` });
});
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

initializeDatabase().then(() => {
    httpServer.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Failed to initialize database:', err);
});
