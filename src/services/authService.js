const { randomUUID } = require('crypto');

const VALID_USER = { username: 'admin', role: 'admin' };
const tokens = new Map(); // token -> user

function login(username, password) {
  if (username !== 'admin' || password !== 'admin') {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }
  const token = randomUUID();
  tokens.set(token, VALID_USER);
  return { token, user: VALID_USER };
}

function validateToken(token) {
  if (!token) return null;
  return tokens.get(token) || null;
}

module.exports = {
  login,
  validateToken,
};
