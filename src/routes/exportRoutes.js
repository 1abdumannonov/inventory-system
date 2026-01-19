const express = require('express');
const exportService = require('../services/exportService');

const router = express.Router();

router.get('/products', (req, res) => {
  const csv = exportService.productsToCsv();
  res.header('Content-Type', 'text/csv');
  res.attachment('products.csv');
  res.send(csv);
});

module.exports = router;
