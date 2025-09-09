const ZERO = 0;
const IV_LENGTH = 12;

export const joinVectorAndEncryptedData = (vector: Uint8Array<ArrayBuffer>, cipherText: ArrayBuffer): Uint8Array<ArrayBuffer> => {
	if (vector.length !== IV_LENGTH) {
		throw new Error('Invalid vector length');
	}

	const output = new Uint8Array(vector.length + cipherText.byteLength);

	output.set(vector);
	output.set(new Uint8Array(cipherText), vector.length);

	return output;
};

export const splitVectorAndEncryptedData = (cipherText: Uint8Array<ArrayBuffer>): [Uint8Array<ArrayBuffer>, Uint8Array<ArrayBuffer>] => {
	if (cipherText.length <= IV_LENGTH) {
		throw new Error('Invalid cipherText length');
	}

	return [cipherText.slice(ZERO, IV_LENGTH), cipherText.slice(IV_LENGTH)];
};
