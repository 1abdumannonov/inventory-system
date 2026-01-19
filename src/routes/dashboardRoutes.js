const express = require('express');
const statsService = require('../services/statsService');

const router = express.Router();

router.get('/summary', (req, res) => {
  const stats = statsService.getDashboardStats();
  res.json(stats);
});

module.exports = router;
