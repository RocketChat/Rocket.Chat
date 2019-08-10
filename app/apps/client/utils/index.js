function getRandomInt(max) {
	return Math.floor(Math.random() * Math.floor(max));
}

/**
 * Generate a random string with the specified length.
 * @param length the length for the generated random string.
 */
export function randomString(length) {
	const buffer = [];
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < length; i++) {
		buffer.push(chars[getRandomInt(chars.length)]);
	}
	return buffer.join('');
}
