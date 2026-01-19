const express = require('express');
const movementService = require('../services/movementService');

const router = express.Router();

router.get('/', (req, res) => {
  res.json(movementService.listMovements());
});

router.post('/', (req, res, next) => {
  try {
    const result = movementService.recordMovement(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
