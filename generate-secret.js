// Generate NEXTAUTH_SECRET
const crypto = require('crypto');

const secret = crypto.randomBytes(32).toString('base64');

console.log('\n===========================================');
console.log('🔑 Your NEXTAUTH_SECRET:');
console.log('===========================================\n');
console.log(secret);
console.log('\n===========================================');
console.log('Copy this and paste it in your .env file:');
console.log('===========================================\n');
console.log(`NEXTAUTH_SECRET="${secret}"`);
console.log('\n');
