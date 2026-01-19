const express = require('express');
const authService = require('../services/authService');

const router = express.Router();

router.post('/login', (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    const result = authService.login(username, password);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
