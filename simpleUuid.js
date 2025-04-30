/**
 * Generate a simple UUID v4
 * @returns {string} A UUID v4 string
 */
function uuid() {
    const hexDigits = '0123456789abcdef';
    let uuid = '';

    // Generate 32 hex digits and add hyphens at specific positions
    for (let i = 0; i < 36; i++) {
        if (i === 8 || i === 13 || i === 18 || i === 23) {
            uuid += '-';
        } else if (i === 14) {
            // Version 4 UUID always has the third segment starting with '4'
            uuid += '4';
        } else if (i === 19) {
            // RFC 4122 variant: high bits of clock_seq_hi_and_reserved should be '10'
            uuid += hexDigits[(Math.random() * 4 | 0) + 8];
        } else {
            uuid += hexDigits[Math.random() * 16 | 0];
        }
    }

    return uuid;
}

// Example usage
console.log('Generated UUID:', uuid());

module.exports = uuid; 