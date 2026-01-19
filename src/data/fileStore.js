const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', '..', 'data');

function ensureFile(fileName, fallback) {
  const filePath = path.join(dataDir, fileName);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
  }
  return filePath;
}

function readJson(fileName, fallback = []) {
  const filePath = ensureFile(fileName, fallback);
  const raw = fs.readFileSync(filePath, 'utf8');
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to parse ${fileName}:`, err);
    return fallback;
  }
}

function writeJson(fileName, data) {
  const filePath = ensureFile(fileName, []);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function getProducts() {
  return readJson('products.json');
}

function saveProducts(products) {
  writeJson('products.json', products);
}

function getMovements() {
  return readJson('movements.json');
}

function saveMovements(movements) {
  writeJson('movements.json', movements);
}

module.exports = {
  getProducts,
  saveProducts,
  getMovements,
  saveMovements,
};
