const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate UUID using Node.js crypto module
 * @returns {string} UUID v4 string
 */
function generateUUIDWithCrypto() {
    return crypto.randomUUID();
}

/**
 * Generate UUID using uuid package
 * @returns {string} UUID v4 string
 */
function generateUUIDWithPackage() {
    return uuidv4();
}

// Example usage
console.log('UUID using crypto:', generateUUIDWithCrypto());
console.log('UUID using uuid package:', generateUUIDWithPackage());

module.exports = {
    generateUUIDWithCrypto,
    generateUUIDWithPackage
}; 