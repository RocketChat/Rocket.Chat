import { Random } from './random.ts';

export class Retry {
	baseTimeout: number;

	exponent: number;

	maxTimeout: number;

	minTimeout: number;

	minCount: number;

	fuzz: number;

	retryTimer: ReturnType<typeof setTimeout> | null;

	constructor({ baseTimeout = 1000, exponent = 2.2, maxTimeout = 5 * 60 * 1000, minTimeout = 10, minCount = 2, fuzz = 0.5 } = {}) {
		this.baseTimeout = baseTimeout;
		this.exponent = exponent;
		this.maxTimeout = maxTimeout;
		this.minTimeout = minTimeout;
		this.minCount = minCount;
		this.fuzz = fuzz;
		this.retryTimer = null;
	}

	clear() {
		if (this.retryTimer) {
			clearTimeout(this.retryTimer);
		}
		this.retryTimer = null;
	}

	_timeout(count: number) {
		if (count < this.minCount) {
			return this.minTimeout;
		}

		return (
			Math.min(this.maxTimeout, this.baseTimeout * Math.pow(this.exponent, count)) * (Random.fraction() * this.fuzz + (1 - this.fuzz / 2))
		);
	}

	retryLater(count: number, fn: () => void) {
		const timeout = this._timeout(count);
		if (this.retryTimer) clearTimeout(this.retryTimer);
		this.retryTimer = setTimeout(fn, timeout);
		return timeout;
	}
}
