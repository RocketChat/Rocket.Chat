declare module 'meteor/base64' {
	export const Base64: {
		encode(asciiEncoded: string | Uint8Array): string;
		decode(base64Encoded: string): Uint8Array;
		newBinary(length: number): Uint8Array;
	};
}
