import express from 'express';
import dotenv from 'dotenv';
import { corsMiddleware } from './middleware/cors.js';
import healthRouter from './routes/health.js';
import aiRouter from './routes/ai.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(corsMiddleware);

// Enable JSON & URL-encoded bodies parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve API Routes
app.use('/api/health', healthRouter);
app.use('/api/ai', aiRouter);

// Root Mock API confirmation route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the AI Code Editor Backend API Proxy.' });
});

// Graceful 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'API Route Not Found' });
});

// Start Server Listening
app.listen(PORT, () => {
  console.log(`[Proxy Server] Running on http://localhost:${PORT}`);
});

export default app;
