const { getProducts, getMovements } = require('../data/fileStore');

function getDashboardStats() {
  const products = getProducts();
  const movements = getMovements();
  const totalStock = products.reduce((sum, p) => sum + Number(p.stock || 0), 0);
  return {
    products: products.length,
    totalStock,
    movements: movements.length,
  };
}

module.exports = {
  getDashboardStats,
};
