/**
 * Checks if the server is running in micro services mode
 * @returns {boolean}
 */
export function isRunningMs(): boolean {
	return !!process.env.TRANSPORTER?.match(/^(?:nats|TCP)/);
}
