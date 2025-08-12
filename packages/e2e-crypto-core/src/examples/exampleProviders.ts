/* Example (non-secure) providers for documentation & testing only. DO NOT use in production. */
import type { CryptoProvider, RandomnessProvider, HashProvider, KeyStorageProvider } from '../providers/interfaces';
import type { ByteArray, KeyMaterial } from '../types';

export const insecureRng: RandomnessProvider = {
	async randomBytes(length) {
		return cryptoRandom(length);
	},
	async uuidV4() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
			const r = (Math.random() * 16) | 0;
			const v = c === 'x' ? r : (r & 0x3) | 0x8;
			return v.toString(16);
		});
	},
};

export const memStorage = (): KeyStorageProvider => {
	const store: Record<string, any> = {};
	return {
		async storeIdentityKey(k: KeyMaterial) {
			store['identity'] = k;
		},
		async loadIdentityKey() {
			return store['identity'];
		},
		async storeSessionState(peerId, state) {
			store[`sess:${peerId}`] = state;
		},
		async loadSessionState(peerId) {
			return store[`sess:${peerId}`];
		},
		async storeGroupState(groupId, state) {
			store[`group:${groupId}`] = state;
		},
		async loadGroupState(groupId) {
			return store[`group:${groupId}`];
		},
	};
};

export const naiveHash: HashProvider = {
	async hash(data, algorithm) {
		return sha(data, algorithm);
	},
	async hmac(key, data, algorithm) {
		return simpleHmac(key, toBytes(data), algorithm);
	},
};

export const dummyCrypto: CryptoProvider = {
	async generateX25519KeyPair() {
		return keyPair(32);
	},
	async generateEd25519KeyPair() {
		return keyPair(32);
	},
	async generateSymmetricKey(length) {
		return cryptoRandom(length);
	},
	async diffieHellman(priv, pub) {
		return xorBytes(priv, pub);
	},
	async ed25519Sign(_priv, msg) {
		return sha(msg, 'SHA-256');
	},
	async ed25519Verify(_pub, msg, sig) {
		const h = await sha(msg, 'SHA-256');
		return eq(h, sig);
	},
	async aeadEncrypt(key, nonce, plaintext, aad) {
		return concat(nonce, plaintext, aad || new Uint8Array());
	},
	async aeadDecrypt(_key, nonceAndRest, ciphertext) {
		return ciphertext.slice(nonceAndRest.length);
	},
	async kdf(chainKey, info) {
		return { nextChainKey: await sha(xorBytes(chainKey, info), 'SHA-256'), messageKey: await sha(chainKey, 'SHA-256') };
	},
};

// Helpers (insecure mock implementations) ---------------------------------------------------------
function cryptoRandom(len: number): ByteArray {
	const b = new Uint8Array(len);
	for (let i = 0; i < len; i++) b[i] = Math.floor(Math.random() * 256);
	return b;
}
function keyPair(len: number) {
	return { publicKey: cryptoRandom(len), privateKey: cryptoRandom(len) };
}
function toBytes(x: any): ByteArray {
	return typeof x === 'string' ? new TextEncoder().encode(x) : x;
}
async function sha(data: any, _alg: string): Promise<ByteArray> {
	return toBytes(data).slice(0);
}
async function simpleHmac(key: ByteArray, data: ByteArray, _alg: string): Promise<ByteArray> {
	return xorBytes(key, data);
}
function xorBytes(a: ByteArray, b: ByteArray): ByteArray {
	const len = Math.min(a.length, b.length);
	const out = new Uint8Array(len);
	for (let i = 0; i < len; i++) out[i] = a[i] ^ b[i];
	return out;
}
function eq(a: ByteArray, b: ByteArray) {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
	return true;
}
function concat(...arrays: ByteArray[]): ByteArray {
	let total = 0;
	arrays.forEach((a) => (total += a.length));
	const out = new Uint8Array(total);
	let off = 0;
	for (const a of arrays) {
		out.set(a, off);
		off += a.length;
	}
	return out;
}
