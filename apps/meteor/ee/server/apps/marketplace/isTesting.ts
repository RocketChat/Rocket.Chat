export function isTesting() {
	return process.env.TEST_MODE === 'true';
}
