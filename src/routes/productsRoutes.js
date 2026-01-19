const express = require('express');
const productService = require('../services/productService');

const router = express.Router();

router.get('/', (req, res) => {
  res.json(productService.listProducts());
});

router.get('/:id', (req, res, next) => {
  try {
    const product = productService.getProductById(req.params.id);
    res.json(product);
  } catch (err) {
    next(err);
  }
});

router.post('/', (req, res, next) => {
  try {
    const product = productService.createProduct(req.body);
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', (req, res, next) => {
  try {
    const product = productService.updateProduct(req.params.id, req.body);
    res.json(product);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', (req, res, next) => {
  try {
    const product = productService.deleteProduct(req.params.id);
    res.json(product);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
