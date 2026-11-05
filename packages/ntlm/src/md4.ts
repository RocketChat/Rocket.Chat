/**
 * MD4 (RFC 1320), in pure JavaScript.
 *
 * NTLM mandates MD4 for the password hash, and `crypto.createHash('md4')` throws on OpenSSL 3, which moved
 * it to the legacy provider. Enabling that provider would mean requiring a Node flag on every deployment.
 *
 */

const rotl = (value: number, shift: number): number => ((value << shift) | (value >>> (32 - shift))) >>> 0;

const f = (x: number, y: number, z: number): number => (x & y) | (~x & z);
const g = (x: number, y: number, z: number): number => (x & y) | (x & z) | (y & z);
const h = (x: number, y: number, z: number): number => x ^ y ^ z;

/** Rounds 2 and 3 visit the message words out of order. Straight from the RFC. */
const ROUND2_ORDER = [0, 4, 8, 12, 1, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15];
const ROUND3_ORDER = [0, 8, 4, 12, 2, 10, 6, 14, 1, 9, 5, 13, 3, 11, 7, 15];

const ROUND1_SHIFTS = [3, 7, 11, 19];
const ROUND2_SHIFTS = [3, 5, 9, 13];
const ROUND3_SHIFTS = [3, 9, 11, 15];

const ROUND2_CONSTANT = 0x5a827999;
const ROUND3_CONSTANT = 0x6ed9eba1;

const pad = (message: Buffer): Buffer => {
	const bitLength = BigInt(message.length) * BigInt(8);
	// 0x80, then zeros to 56 mod 64, then the bit length as 8 bytes little endian.
	const paddedLength = Math.ceil((message.length + 9) / 64) * 64;
	const padded = Buffer.alloc(paddedLength);

	message.copy(padded);
	padded[message.length] = 0x80;
	padded.writeBigUInt64LE(bitLength, paddedLength - 8);

	return padded;
};

export const md4 = (message: Buffer): Buffer => {
	const padded = pad(message);

	let a0 = 0x67452301;
	let b0 = 0xefcdab89;
	let c0 = 0x98badcfe;
	let d0 = 0x10325476;

	for (let offset = 0; offset < padded.length; offset += 64) {
		const x = new Array<number>(16);
		for (let i = 0; i < 16; i++) {
			x[i] = padded.readUInt32LE(offset + i * 4);
		}

		let [a, b, c, d] = [a0, b0, c0, d0];

		for (let i = 0; i < 16; i++) {
			const shift = ROUND1_SHIFTS[i % 4];
			const value = rotl((a + f(b, c, d) + x[i]) >>> 0, shift);
			[a, b, c, d] = [d, value, b, c];
		}

		for (let i = 0; i < 16; i++) {
			const shift = ROUND2_SHIFTS[i % 4];
			const value = rotl((a + g(b, c, d) + x[ROUND2_ORDER[i]] + ROUND2_CONSTANT) >>> 0, shift);
			[a, b, c, d] = [d, value, b, c];
		}

		for (let i = 0; i < 16; i++) {
			const shift = ROUND3_SHIFTS[i % 4];
			const value = rotl((a + h(b, c, d) + x[ROUND3_ORDER[i]] + ROUND3_CONSTANT) >>> 0, shift);
			[a, b, c, d] = [d, value, b, c];
		}

		a0 = (a0 + a) >>> 0;
		b0 = (b0 + b) >>> 0;
		c0 = (c0 + c) >>> 0;
		d0 = (d0 + d) >>> 0;
	}

	const digest = Buffer.alloc(16);
	digest.writeUInt32LE(a0, 0);
	digest.writeUInt32LE(b0, 4);
	digest.writeUInt32LE(c0, 8);
	digest.writeUInt32LE(d0, 12);

	return digest;
};
