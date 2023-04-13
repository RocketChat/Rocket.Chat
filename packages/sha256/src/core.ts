function safeAdd(x: number, y: number) {
	const lsw = (x & 0xffff) + (y & 0xffff);
	const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
	return (msw << 16) | (lsw & 0xffff);
}

function s(x: number, n: number) {
	return (x >>> n) | (x << (32 - n));
}

function r(x: number, n: number) {
	return x >>> n;
}

function ch(x: number, y: number, z: number) {
	return (x & y) ^ (~x & z);
}

function maj(x: number, y: number, z: number) {
	return (x & y) ^ (x & z) ^ (y & z);
}

function sigma0256(x: number) {
	return s(x, 2) ^ s(x, 13) ^ s(x, 22);
}

function sigma1256(x: number) {
	return s(x, 6) ^ s(x, 11) ^ s(x, 25);
}

function gamma0256(x: number) {
	return s(x, 7) ^ s(x, 18) ^ r(x, 3);
}

function gamma1256(x: number) {
	return s(x, 17) ^ s(x, 19) ^ r(x, 10);
}

export function core(m: number[], l: number) {
	const K = [
		0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be,
		0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0xfc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa,
		0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x6ca6351, 0x14292967, 0x27b70a85,
		0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
		0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f,
		0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
	];
	const HASH = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
	const W = [64];
	let a;
	let b;
	let c;
	let d;
	let e;
	let f;
	let g;
	let h;
	let i;
	let j;
	let T1;
	let T2;

	m[l >> 5] |= 0x80 << (24 - (l % 32));
	m[(((l + 64) >> 9) << 4) + 15] = l;

	for (i = 0; i < m.length; i += 16) {
		a = HASH[0];
		b = HASH[1];
		c = HASH[2];
		d = HASH[3];
		e = HASH[4];
		f = HASH[5];
		g = HASH[6];
		h = HASH[7];

		for (j = 0; j < 64; j++) {
			if (j < 16) W[j] = m[j + i];
			else W[j] = safeAdd(safeAdd(safeAdd(gamma1256(W[j - 2]), W[j - 7]), gamma0256(W[j - 15])), W[j - 16]);

			T1 = safeAdd(safeAdd(safeAdd(safeAdd(h, sigma1256(e)), ch(e, f, g)), K[j]), W[j]);
			T2 = safeAdd(sigma0256(a), maj(a, b, c));

			h = g;
			g = f;
			f = e;
			e = safeAdd(d, T1);
			d = c;
			c = b;
			b = a;
			a = safeAdd(T1, T2);
		}

		HASH[0] = safeAdd(a, HASH[0]);
		HASH[1] = safeAdd(b, HASH[1]);
		HASH[2] = safeAdd(c, HASH[2]);
		HASH[3] = safeAdd(d, HASH[3]);
		HASH[4] = safeAdd(e, HASH[4]);
		HASH[5] = safeAdd(f, HASH[5]);
		HASH[6] = safeAdd(g, HASH[6]);
		HASH[7] = safeAdd(h, HASH[7]);
	}
	return HASH;
}
