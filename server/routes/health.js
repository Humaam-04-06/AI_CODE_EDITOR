import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
    environment: process.env.NODE_ENV || 'development'
  });
});

export default router;
