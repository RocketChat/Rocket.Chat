export type RetryOptions = {
	baseTimeout?: number;
	exponent?: number;
	maxTimeout?: number;
	minTimeout?: number;
	minCount?: number;
	fuzz?: number;
};

export class Retry {
	baseTimeout: number;
	exponent: number;
	maxTimeout: number;
	minTimeout: number;
	minCount: number;
	fuzz: number;
	retryTimer: ReturnType<typeof setTimeout> | null;

	constructor({
		baseTimeout = 1000,
		exponent = 2.2,
		// The default is high-ish to ensure a server can recover from a failure caused by load.
		maxTimeout = 5 * 60 * 1000,
		minTimeout = 10,
		minCount = 2,
		fuzz = 0.5,
	}: RetryOptions = {}) {
		this.baseTimeout = baseTimeout;
		this.exponent = exponent;
		this.maxTimeout = maxTimeout;
		this.minTimeout = minTimeout;
		this.minCount = minCount;
		this.fuzz = fuzz;
		this.retryTimer = null;
	}

	// Reset a pending retry, if any.
	clear(): void {
		if (this.retryTimer) {
			clearTimeout(this.retryTimer);
		}
		this.retryTimer = null;
	}

	// Calculate how long to wait in milliseconds to retry, based on the `count` of which retry this is.
	_timeout(count: number): number {
		if (count < this.minCount) {
			return this.minTimeout;
		}

		// Fuzz the timeout randomly to avoid reconnect storms when a server goes down.
		const timeout = Math.min(
			this.maxTimeout,
			this.baseTimeout * Math.pow(this.exponent, count)
		) * (Math.random() * this.fuzz + (1 - this.fuzz / 2));

		return timeout;
	}

	// Call `fn` after a delay, based on the `count` of which retry this is.
	retryLater(count: number, fn: () => void): number {
		const timeout = this._timeout(count);

		if (this.retryTimer) {
			clearTimeout(this.retryTimer);
		}

		this.retryTimer = setTimeout(fn, timeout);
		return timeout;
	}
}