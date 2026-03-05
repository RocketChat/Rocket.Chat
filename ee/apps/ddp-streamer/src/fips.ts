import crypto from 'crypto';

const OPENSSL_CONFIG_PATH = '/etc/ssl/openssl-ddp-streamer-fips.cnf';
const hasOpenSSLConfigFlag = process.execArgv.some((arg) => arg.startsWith('--openssl-config='));
const hasOpenSSLSharedConfigFlag = process.execArgv.includes('--openssl-shared-config');

console.log('=========================================');
console.log(`Node FIPS Mode Flag: ${crypto.getFips() === 1 ? 'ENABLED' : 'DISABLED'}`);
console.log(`OpenSSL Config Path: ${OPENSSL_CONFIG_PATH}`);
console.log(`OpenSSL Config Flag Present: ${hasOpenSSLConfigFlag ? 'YES' : 'NO'}`);
console.log(`OpenSSL Shared Config Flag Present: ${hasOpenSSLSharedConfigFlag ? 'YES' : 'NO'}`);
console.log('OpenSSL provider policy expected: fips + default fallback.');
console.log('=========================================');
