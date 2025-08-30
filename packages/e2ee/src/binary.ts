// Returns the input unchanged if it's already a string; otherwise treats the input
// as an ArrayBuffer / TypedArray whose bytes become 1:1 char codes in the string.
export const toString = (data: ArrayBuffer): string => {
	const u8 = new Uint8Array(data);

	// Convert in chunks to avoid exceeding argument length limits
	const CHUNK = 0x80_00;
	let result = '';
	for (let i = 0; i < u8.length; i += CHUNK) {
		result += String.fromCodePoint(...u8.subarray(i, i + CHUNK));
	}
	return result;
};

// Converts a "binary string" (each charCode 0–255) to an ArrayBuffer.
// Returns undefined if input is undefined; passes through existing ArrayBuffer; copies TypedArray/DataView.
export const toArrayBuffer = (data: string): Uint8Array<ArrayBuffer> => {
	const BYTE_RANGE = 0x1_00; // 256 possible byte values
	const INCREMENT = 1;
	const len = data.length;
	const u8 = new Uint8Array(len);
	for (let i = 0; i < len; i += INCREMENT) {
		// Mimic old ByteBuffer 'binary' behavior: low 8 bits only
		const code = data.charCodeAt(i);
		u8[i] = code % BYTE_RANGE;
	}
	return u8;
};
