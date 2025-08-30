const { fromBase64 } = globalThis.Uint8Array;
const { toBase64 } = globalThis.Uint8Array.prototype;

export const fromB64Fallback = (string: string): Uint8Array<ArrayBuffer> => {
	const binary = atob(string);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
};

export const fromB64: (string: string) => Uint8Array<ArrayBuffer> =
	/* v8 ignore next -- @preserve */ typeof fromBase64 === 'function' ? fromBase64 : fromB64Fallback;

export const toB64Fallback = (input: Uint8Array<ArrayBuffer>): string => {
	const CHUNK_SIZE = 0x80_00;
	const arr = [];
	for (let i = 0; i < input.length; i += CHUNK_SIZE) {
		arr.push(String.fromCodePoint(...input.subarray(i, i + CHUNK_SIZE)));
	}
	return btoa(arr.join(''));
};

export const toB64: (input: Uint8Array<ArrayBuffer>) => string =
	/* v8 ignore next -- @preserve */
	typeof toBase64 === 'function' ? (input) => toBase64.call(input) : toB64Fallback;

export const parseUint8Array = (json: string): Uint8Array<ArrayBuffer> => {
	const parsed = JSON.parse(json);
	if (typeof parsed !== 'object' || parsed === null || !('$binary' in parsed) || typeof parsed.$binary !== 'string') {
		throw new TypeError('Invalid JSON format, expected {"$binary":"..."}');
	}
	return fromB64(parsed.$binary);
};

export const stringifyUint8Array = (data: Uint8Array<ArrayBuffer>): string => `{"$binary":"${toB64(data)}"}`;
