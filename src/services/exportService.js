const { getProducts } = require('../data/fileStore');

function escapeCsv(value) {
  const str = value === undefined || value === null ? '' : String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function productsToCsv() {
  const products = getProducts();
  const headers = ['id', 'name', 'category', 'price', 'stock'];
  const lines = [headers.join(',')];
  products.forEach((p) => {
    lines.push([
      escapeCsv(p.id),
      escapeCsv(p.name),
      escapeCsv(p.category),
      p.price,
      p.stock,
    ].join(','));
  });
  return lines.join('\n');
}

module.exports = {
  productsToCsv,
};
