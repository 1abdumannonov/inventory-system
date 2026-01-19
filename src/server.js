const express = require('express');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const productsRoutes = require('./routes/productsRoutes');
const movementsRoutes = require('./routes/movementsRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const exportRoutes = require('./routes/exportRoutes');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve static frontend assets
app.use(express.static(path.join(__dirname, '..', 'public')));

// Default entry routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/products', authMiddleware, productsRoutes);
app.use('/api/movements', authMiddleware, movementsRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/export', authMiddleware, exportRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error: ${err.message}`, err.stack);
  const status = err.status || 500;
  const body = { message: err.message || 'Internal server error' };
  if (err.code) body.code = err.code;
  if (err.details) body.details = err.details;
  res.status(status).json(body);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

