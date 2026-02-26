/**
 * Determine whether the application is running in testing mode.
 *
 * @returns `true` if the `TEST_MODE` environment variable equals `'true'`, `false` otherwise.
 */
export function isTesting() {
	return process.env.TEST_MODE === 'true';
}
