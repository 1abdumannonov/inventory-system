const { randomUUID } = require('crypto');
const { getProducts, saveProducts } = require('../data/fileStore');

function listProducts() {
  return getProducts();
}

function getProductById(id) {
  const products = getProducts();
  const product = products.find((p) => p.id === id);
  if (!product) {
    const err = new Error('Product not found');
    err.status = 404;
    throw err;
  }
  return product;
}

function createProduct(payload) {
  const { name, category, price, stock } = payload || {};
  if (!name || !category) {
    const err = new Error('Name and category are required');
    err.status = 400;
    throw err;
  }
  const priceNum = Number(price);
  const stockNum = Number(stock);
  if (Number.isNaN(priceNum) || priceNum < 0) {
    const err = new Error('Price must be a non-negative number');
    err.status = 400;
    throw err;
  }
  if (!Number.isInteger(stockNum) || stockNum < 0) {
    const err = new Error('Stock must be a non-negative integer');
    err.status = 400;
    throw err;
  }
  const products = getProducts();
  const product = {
    id: randomUUID(),
    name: String(name).trim(),
    category: String(category).trim(),
    price: priceNum,
    stock: stockNum,
  };
  products.push(product);
  saveProducts(products);
  return product;
}

function updateProduct(id, payload) {
  const products = getProducts();
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) {
    const err = new Error('Product not found');
    err.status = 404;
    throw err;
  }
  const product = products[idx];
  if (payload.name !== undefined) product.name = String(payload.name).trim();
  if (payload.category !== undefined) product.category = String(payload.category).trim();
  if (payload.price !== undefined) {
    const priceNum = Number(payload.price);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      const err = new Error('Price must be a non-negative number');
      err.status = 400;
      throw err;
    }
    product.price = priceNum;
  }
  if (payload.stock !== undefined) {
    const stockNum = Number(payload.stock);
    if (!Number.isInteger(stockNum) || stockNum < 0) {
      const err = new Error('Stock must be a non-negative integer');
      err.status = 400;
      throw err;
    }
    product.stock = stockNum;
  }
  products[idx] = product;
  saveProducts(products);
  return product;
}

function deleteProduct(id) {
  const products = getProducts();
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) {
    const err = new Error('Product not found');
    err.status = 404;
    throw err;
  }
  const [removed] = products.splice(idx, 1);
  saveProducts(products);
  return removed;
}

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
