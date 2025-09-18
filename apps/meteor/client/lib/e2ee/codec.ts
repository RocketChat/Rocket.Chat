import { Base64 } from '@rocket.chat/base64';

// A 256-byte array always encodes to 344 characters in Base64.
const DECODED_LENGTH = 256;
// ((4 * 256 / 3) + 3) & ~3 = 344
const ENCODED_LENGTH = 344;

export const decodePrefixedBase64 = (input: string): [prefix: string, data: Uint8Array<ArrayBuffer>] => {
	// 1. Validate the input string length
	if (input.length < ENCODED_LENGTH) {
		throw new RangeError('Invalid input length.');
	}

	// 2. Split the string into its two parts
	const prefix = input.slice(0, -ENCODED_LENGTH);
	const base64Data = input.slice(-ENCODED_LENGTH);

	// 3. Decode the Base64 string. atob() decodes to a "binary string".
	const bytes = Base64.decode(base64Data);

	if (bytes.length !== DECODED_LENGTH) {
		// This is a sanity check in case the Base64 string was valid but didn't decode to 256 bytes.
		throw new RangeError('Decoded data length is too short.');
	}

	return [prefix, bytes];
};

export const encodePrefixedBase64 = (prefix: string, data: Uint8Array<ArrayBuffer>): string => {
	// 1. Validate the input data length
	if (data.length !== DECODED_LENGTH) {
		throw new RangeError(`Input data length is ${data.length}, but expected ${DECODED_LENGTH} bytes.`);
	}

	// 2. Convert the byte array (Uint8Array) into a "binary string"
	const base64Data = Base64.encode(data);

	if (base64Data.length !== ENCODED_LENGTH) {
		// This is a sanity check in case something went wrong during encoding.
		throw new RangeError(`Encoded Base64 length is ${base64Data.length}, but expected ${ENCODED_LENGTH} characters.`);
	}

	// 4. Concatenate the prefix and the Base64 string
	return prefix + base64Data;
};
