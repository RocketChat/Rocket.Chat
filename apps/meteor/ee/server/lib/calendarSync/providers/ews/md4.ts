/**
 * Pure-TypeScript MD4 (RFC 1320). Required for NTLM's NTOWFv2 key derivation:
 * OpenSSL 3 (bundled with modern Node.js) removed MD4 from the default provider,
 * so `crypto.createHash('md4')` is not available. MD4 is used here exclusively
 * as a key-derivation step of the NTLM protocol — not for general hashing.
 */

function leftRotate(value: number, shift: number): number {
	return ((value << shift) | (value >>> (32 - shift))) >>> 0;
}

export function md4(input: Buffer): Buffer {
	// Pre-processing: pad to 64-byte blocks with 0x80, zeros, and the 64-bit bit length
	const bitLength = input.length * 8;
	const paddedLength = (((input.length + 8) >> 6) + 1) << 6;
	const padded = Buffer.alloc(paddedLength);
	input.copy(padded);
	padded[input.length] = 0x80;
	padded.writeUInt32LE(bitLength >>> 0, paddedLength - 8);
	padded.writeUInt32LE(Math.floor(bitLength / 0x100000000), paddedLength - 4);

	let a = 0x67452301;
	let b = 0xefcdab89;
	let c = 0x98badcfe;
	let d = 0x10325476;

	const x = new Array<number>(16);

	for (let block = 0; block < paddedLength; block += 64) {
		for (let i = 0; i < 16; i++) {
			x[i] = padded.readUInt32LE(block + i * 4);
		}

		const aa = a;
		const bb = b;
		const cc = c;
		const dd = d;

		const f = (v: number, w: number, z: number): number => (v & w) | (~v & z);
		const g = (v: number, w: number, z: number): number => (v & w) | (v & z) | (w & z);
		const h = (v: number, w: number, z: number): number => v ^ w ^ z;

		const round1 = (p: number, q: number, r: number, s: number, k: number, sh: number): number =>
			leftRotate((p + f(q, r, s) + x[k]) >>> 0, sh);
		const round2 = (p: number, q: number, r: number, s: number, k: number, sh: number): number =>
			leftRotate((p + g(q, r, s) + x[k] + 0x5a827999) >>> 0, sh);
		const round3 = (p: number, q: number, r: number, s: number, k: number, sh: number): number =>
			leftRotate((p + h(q, r, s) + x[k] + 0x6ed9eba1) >>> 0, sh);

		for (const k of [0, 4, 8, 12]) {
			a = round1(a, b, c, d, k, 3);
			d = round1(d, a, b, c, k + 1, 7);
			c = round1(c, d, a, b, k + 2, 11);
			b = round1(b, c, d, a, k + 3, 19);
		}

		for (const k of [0, 1, 2, 3]) {
			a = round2(a, b, c, d, k, 3);
			d = round2(d, a, b, c, k + 4, 5);
			c = round2(c, d, a, b, k + 8, 9);
			b = round2(b, c, d, a, k + 12, 13);
		}

		for (const k of [0, 2, 1, 3]) {
			a = round3(a, b, c, d, k, 3);
			d = round3(d, a, b, c, k + 8, 9);
			c = round3(c, d, a, b, k + 4, 11);
			b = round3(b, c, d, a, k + 12, 15);
		}

		a = (a + aa) >>> 0;
		b = (b + bb) >>> 0;
		c = (c + cc) >>> 0;
		d = (d + dd) >>> 0;
	}

	const digest = Buffer.alloc(16);
	digest.writeUInt32LE(a, 0);
	digest.writeUInt32LE(b, 4);
	digest.writeUInt32LE(c, 8);
	digest.writeUInt32LE(d, 12);
	return digest;
}
