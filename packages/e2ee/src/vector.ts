const ZERO = 0x00;
const IV_LENGTH = 0x10;

export const joinVectorAndEncryptedData = (vector: Uint8Array<ArrayBuffer>, cipherText: ArrayBuffer): Uint8Array<ArrayBuffer> => {
	if (vector.length !== IV_LENGTH) {
		throw new Error(`Invalid vector length: ${vector.length}`);
	}

	const output = new Uint8Array(vector.length + cipherText.byteLength);

	output.set(vector);
	output.set(new Uint8Array(cipherText), vector.length);

	return output;
};

export const splitVectorAndEncryptedData = (cipherText: Uint8Array<ArrayBuffer>): [Uint8Array<ArrayBuffer>, Uint8Array<ArrayBuffer>] => {
	if (cipherText.length <= IV_LENGTH) {
		throw new Error(`Invalid cipherText length: ${cipherText.length}`);
	}

	return [cipherText.slice(ZERO, IV_LENGTH), cipherText.slice(IV_LENGTH)];
};
