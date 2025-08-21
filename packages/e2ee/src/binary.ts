// Returns the input unchanged if it's already a string; otherwise treats the input
// as an ArrayBuffer / TypedArray / DataView whose bytes become 1:1 code points in the string.
export const toString = (data: Uint8Array<ArrayBuffer>): string => {
	if (typeof data === 'string') {
		return data;
	}

	const u8: Uint8Array = new Uint8Array(data.length);

	// Convert in chunks to avoid exceeding argument length limits (spread arg cap)
	const CHUNK_SIZE = 32_768; // 32 KB per chunk
	let result = '';
	for (let offset = 0; offset < u8.length; offset += CHUNK_SIZE) {
		const slice = u8.subarray(offset, offset + CHUNK_SIZE);
		result += String.fromCodePoint(...slice);
	}
	return result;
};

// Converts a "binary string" (each charCode 0–255) to an ArrayBuffer.
// Returns undefined if input is undefined; passes through existing ArrayBuffer; copies TypedArray/DataView.
export const toArrayBuffer = (data: string): Uint8Array<ArrayBuffer> => {
	if (!data) {
		return new Uint8Array();
	}

	const BYTE_RANGE = 256;
	const FALLBACK_CODE_POINT = 0;
	const INCREMENT = 1;
	const len = data.length;
	const u8 = new Uint8Array(len);
	for (let i = 0; i < len; i += INCREMENT) {
		// Mimic old ByteBuffer 'binary' behavior: low 8 bits only
		const code = data.codePointAt(i) ?? FALLBACK_CODE_POINT;
		u8[i] = code % BYTE_RANGE;
	}
	return u8;
};
