// A 256-byte array always encodes to 344 characters in Base64.
const DECODED_LENGTH = 256;
const ENCODED_LENGTH = 344;

export const decodePrefixedBase64 = (inputString: string): [prefix: string, data: Uint8Array<ArrayBuffer>] => {
	// 1. Validate the input string length
	if (inputString.length < ENCODED_LENGTH) {
		throw new Error(`Input string is too short. It must be at least ${ENCODED_LENGTH} characters long.`);
	}

	// 2. Split the string into its two parts
	const prefix = inputString.slice(0, -ENCODED_LENGTH);
	const base64Data = inputString.slice(-ENCODED_LENGTH);

	// 3. Decode the Base64 string. atob() decodes to a "binary string".
	const decodedBinaryString = atob(base64Data);

	// 4. Convert the binary string into a proper byte array (Uint8Array)
	const bytes = new Uint8Array(decodedBinaryString.length);
	for (let i = 0; i < decodedBinaryString.length; i++) {
		bytes[i] = decodedBinaryString.charCodeAt(i);
	}

	if (bytes.length !== DECODED_LENGTH) {
		// This is a sanity check in case the Base64 string was valid but didn't decode to 256 bytes.
		throw new Error(`Decoded data length is ${bytes.length}, but expected ${DECODED_LENGTH} bytes.`);
	}

	return [prefix, bytes];
};
