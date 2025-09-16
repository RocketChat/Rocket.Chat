// A 256-byte array always encodes to 344 characters in Base64.
const DECODED_LENGTH = 256;
// ((4 * 256 / 3) + 3) & ~3 = 344
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

export const encodePrefixedBase64 = (prefix: string, data: Uint8Array<ArrayBuffer>): string => {
	// 1. Validate the input data length
	if (data.length !== DECODED_LENGTH) {
		throw new Error(`Input data length is ${data.length}, but expected ${DECODED_LENGTH} bytes.`);
	}

	// 2. Convert the byte array (Uint8Array) into a "binary string"
	let binaryString = '';
	for (let i = 0; i < data.length; i++) {
		binaryString += String.fromCharCode(data[i]);
	}

	// 3. Encode the binary string to Base64
	const base64Data = btoa(binaryString);

	if (base64Data.length !== ENCODED_LENGTH) {
		// This is a sanity check in case something went wrong during encoding.
		throw new Error(`Encoded Base64 length is ${base64Data.length}, but expected ${ENCODED_LENGTH} characters.`);
	}

	// 4. Concatenate the prefix and the Base64 string
	return prefix + base64Data;
};
