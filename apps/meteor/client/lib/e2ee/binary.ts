import type { ICodec } from './codec';

export const Binary: ICodec<string, ArrayBuffer> = {
	encode(buffer: ArrayBuffer): string {
		const uint8 = new Uint8Array(buffer);
		const CHUNK_SIZE = 8192; // Process in chunks for performance
		let result = '';
		for (let i = 0; i < uint8.length; i += CHUNK_SIZE) {
			const chunk = uint8.subarray(i, i + CHUNK_SIZE);
			result += String.fromCharCode(...chunk);
		}
		return result;
	},
	decode(str: string): ArrayBuffer {
		// Create a Uint8Array of the same length as the string.
		// This will be a view on the new ArrayBuffer.
		const buffer = new ArrayBuffer(str.length);
		const uint8 = new Uint8Array(buffer);

		// Iterate through the string, getting the character code for each
		// character and setting it as the value for the corresponding byte.
		for (let i = 0; i < str.length; i++) {
			const charCode = str.charCodeAt(i);
			if (charCode > 0xff) {
				throw new RangeError(`illegal char code: ${charCode}`);
			}
			uint8[i] = charCode;
		}

		return buffer;
	},
};
