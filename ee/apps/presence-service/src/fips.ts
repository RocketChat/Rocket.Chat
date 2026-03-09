import crypto from 'crypto';

crypto.setFips(true);

if (crypto.getFips() !== 1) {
	throw new Error('FIPS mode was not enabled after crypto.setFips(true)');
}

console.log('=========================================');
console.log('FIPS COMPLIANCE CHECK: YES');
console.log('=========================================');
