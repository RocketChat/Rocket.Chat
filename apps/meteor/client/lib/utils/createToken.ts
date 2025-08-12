export const createToken = (): string => {
	const array = new Uint8Array(16);
	if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
		window.crypto.getRandomValues(array);
	} else {
		// Use Node.js crypto
		const { randomBytes } = require('crypto'); // eslint-disable-line @typescript-eslint/no-var-requires
		const buffer = randomBytes(16);
		array.set(buffer);
	}
	return Array.from(array)
		.map((byte) => byte.toString(16).padStart(2, '0'))
		.join('');
};
