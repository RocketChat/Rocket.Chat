export const fromBase64: (string: string) => Uint8Array<ArrayBuffer> =
	typeof Uint8Array.fromBase64 === 'function'
		? Uint8Array.fromBase64
		: (string) => {
				const binary = atob(string);
				const bytes = new Uint8Array(binary.length);
				for (let i = 0; i < binary.length; i++) {
					bytes[i] = binary.codePointAt(i) ?? 0;
				}
				return bytes;
			};

export const toBase64: (input: Uint8Array<ArrayBuffer>) => string =
	typeof Uint8Array.prototype.toBase64 === 'function'
		? (input) => Uint8Array.prototype.toBase64.call(input)
		: (input) => {
				const CHUNK_SIZE = 0x80_00;
				const arr = [];
				for (let i = 0; i < input.length; i += CHUNK_SIZE) {
					arr.push(String.fromCodePoint(...input.subarray(i, i + CHUNK_SIZE)));
				}
				return btoa(arr.join(''));
			};

export const parseUint8Array = (json: string): Uint8Array<ArrayBuffer> => {
	const parsed = JSON.parse(json);
	if (typeof parsed !== 'object' || parsed === null || !('$binary' in parsed) || typeof parsed.$binary !== 'string') {
		throw new TypeError('Invalid JSON format, expected {"$binary":"..."}');
	}
	const binaryString = fromBase64(parsed.$binary);
	return new Uint8Array(binaryString);
};

export const stringifyUint8Array = (data: Uint8Array<ArrayBuffer>): string => `{"$binary":"${toBase64(data)}"}`;
