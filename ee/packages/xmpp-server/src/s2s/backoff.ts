const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 5 * 60 * 1000;

/** Exponential backoff with full jitter for outbound reconnect attempts. */
export class Backoff {
	private attempts = 0;

	nextDelayMs(): number {
		const ceiling = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** this.attempts);
		this.attempts += 1;
		return Math.floor(Math.random() * ceiling);
	}

	get attemptCount(): number {
		return this.attempts;
	}

	reset(): void {
		this.attempts = 0;
	}
}
