export async function encryptAESCTR(counter: BufferSource, key: CryptoKey, data: BufferSource) {
	return crypto.subtle.encrypt({ name: 'AES-CTR', counter, length: 64 }, key, data);
}

export function generateAESCTRKey(): Promise<CryptoKey> {
	return crypto.subtle.generateKey({ name: 'AES-CTR', length: 256 }, true, ['encrypt', 'decrypt']);
}

/**
 * Generates 12 uniformly random words from the word list.
 *
 * @remarks
 * Uses {@link https://en.wikipedia.org/wiki/Rejection_sampling | rejection sampling} to ensure uniform distribution.
 *
 * @returns A space-separated passphrase.
 */
export async function generatePassphrase() {
	const { wordlist } = await import('./wordList');

	// Number of words in the passphrase
	const WORD_COUNT = 12;
	// We use 32-bit random numbers, so the maximum value is 2^32 - 1
	const MAX_UINT32 = 0xffffffff;

	const range = wordlist.length;
	const rejectionThreshold = Math.floor(MAX_UINT32 / range) * range;

	const words: string[] = [];
	const buf = new Uint32Array(1);

	for (let i = 0; i < WORD_COUNT; i++) {
		let v: number;
		do {
			crypto.getRandomValues(buf);
			v = buf[0];
		} while (v >= rejectionThreshold);
		words.push(wordlist[v % range]);
	}

	return words.join(' ');
}

/**
 * The name that the server stores for an encrypted file: 32 random bytes as 64 hex characters. The real name is only in
 * the encrypted content. A hash of the name lets anyone who reads the database confirm a guessed name, and shows when two
 * uploads have the same name. A random value shows neither.
 */
export function createRandomFileName() {
	return Array.from(crypto.getRandomValues(new Uint8Array(32)))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

export async function sha256HashFromArrayBuffer(arrayBuffer: ArrayBuffer) {
	const hashArray = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', arrayBuffer)));
	return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
