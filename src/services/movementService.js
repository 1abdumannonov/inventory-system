const { randomUUID } = require('crypto');
const { getProducts, saveProducts, getMovements, saveMovements } = require('../data/fileStore');

function listMovements() {
  return getMovements();
}

function recordMovement(payload) {
  const { productId, type, quantity } = payload || {};
  const qty = Number(quantity);
  if (!productId) {
    const err = new Error('productId is required');
    err.status = 400;
    throw err;
  }
  if (!Number.isInteger(qty) || qty <= 0) {
    const err = new Error('quantity must be a positive integer');
    err.status = 400;
    throw err;
  }
  const movementType = String(type || '').toUpperCase();
  if (movementType !== 'IN' && movementType !== 'OUT') {
    const err = new Error('type must be IN or OUT');
    err.status = 400;
    throw err;
  }
  const products = getProducts();
  const productIdx = products.findIndex((p) => p.id === productId);
  if (productIdx === -1) {
    const err = new Error('Product not found');
    err.status = 404;
    throw err;
  }
  const product = products[productIdx];
  if (movementType === 'OUT' && product.stock < qty) {
    const err = new Error('Insufficient stock for OUT movement');
    err.status = 422;
    err.code = 'INSUFFICIENT_STOCK';
    err.details = { available: product.stock, requested: qty, productId };
    throw err;
  }
  const updatedStock = movementType === 'IN' ? product.stock + qty : product.stock - qty;
  products[productIdx] = { ...product, stock: updatedStock };
  saveProducts(products);

  const movements = getMovements();
  const movement = {
    id: randomUUID(),
    productId,
    productName: product.name,
    type: movementType,
    quantity: qty,
    createdAt: new Date().toISOString(),
  };
  movements.push(movement);
  saveMovements(movements);

  return { movement, product: products[productIdx] };
}

module.exports = {
  listMovements,
  recordMovement,
};
