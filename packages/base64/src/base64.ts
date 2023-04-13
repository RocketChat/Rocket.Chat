// Base 64 encoding

const BASE_64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const BASE_64_VALS = Object.create(null);

const getChar = (val: number) => BASE_64_CHARS.charAt(val);
const getVal = (ch: string) => (ch === '=' ? -1 : BASE_64_VALS[ch]);

for (let i = 0; i < BASE_64_CHARS.length; i++) {
	BASE_64_VALS[getChar(i)] = i;
}

// XXX This is a weird place for this to live, but it's used both by
// this package and 'ejson', and we can't put it in 'ejson' without
// introducing a circular dependency. It should probably be in its own
// package or as a helper in a package that both 'base64' and 'ejson'
// use.
const newBinary = (len: number) => {
	if (typeof Uint8Array === 'undefined' || typeof ArrayBuffer === 'undefined') {
		const ret = Object.assign(
			Array.from({ length: len }, () => 0),
			{
				$Uint8ArrayPolyfill: true,
			},
		);
		return ret;
	}
	return new Uint8Array(new ArrayBuffer(len));
};

const encode = (array: ArrayLike<number> | string) => {
	if (typeof array === 'string') {
		const str = array;
		const binary = newBinary(str.length);
		for (let i = 0; i < str.length; i++) {
			const ch = str.charCodeAt(i);
			if (ch > 0xff) {
				throw new Error('Not ascii. Base64.encode can only take ascii strings.');
			}

			binary[i] = ch;
		}
		array = binary;
	}

	const answer: string[] = [];
	let a: number | null = null;
	let b: number | null = null;
	let c: number | null = null;
	let d: number | null = null;

	for (let i = 0; i < array.length; i++) {
		switch (i % 3) {
			case 0:
				a = (array[i] >> 2) & 0x3f;
				b = (array[i] & 0x03) << 4;
				break;
			case 1:
				b = (b ?? 0) | ((array[i] >> 4) & 0xf);
				c = (array[i] & 0xf) << 2;
				break;
			case 2:
				c = (c ?? 0) | ((array[i] >> 6) & 0x03);
				d = array[i] & 0x3f;
				answer.push(getChar(a ?? 0));
				answer.push(getChar(b ?? 0));
				answer.push(getChar(c));
				answer.push(getChar(d));
				a = null;
				b = null;
				c = null;
				d = null;
				break;
		}
	}

	if (a !== null) {
		answer.push(getChar(a));
		answer.push(getChar(b ?? 0));
		if (c === null) {
			answer.push('=');
		} else {
			answer.push(getChar(c));
		}

		if (d === null) {
			answer.push('=');
		}
	}

	return answer.join('');
};

const decode = (str: string) => {
	let len = Math.floor((str.length * 3) / 4);
	if (str.charAt(str.length - 1) === '=') {
		len--;
		if (str.charAt(str.length - 2) === '=') {
			len--;
		}
	}

	const arr = newBinary(len);

	let one: number | null = null;
	let two: number | null = null;
	let three: number | null = null;

	let j = 0;

	for (let i = 0; i < str.length; i++) {
		const c = str.charAt(i);
		const v = getVal(c);
		switch (i % 4) {
			case 0:
				if (v < 0) {
					throw new Error('invalid base64 string');
				}

				one = v << 2;
				break;
			case 1:
				if (v < 0) {
					throw new Error('invalid base64 string');
				}

				one = (one ?? 0) | (v >> 4);
				arr[j++] = one;
				two = (v & 0x0f) << 4;
				break;
			case 2:
				if (v >= 0) {
					two = (two ?? 0) | (v >> 2);
					arr[j++] = two;
					three = (v & 0x03) << 6;
				}

				break;
			case 3:
				if (v >= 0) {
					arr[j++] = (three ?? 0) | v;
				}

				break;
		}
	}

	return arr;
};

export const Base64 = { encode, decode, newBinary };
