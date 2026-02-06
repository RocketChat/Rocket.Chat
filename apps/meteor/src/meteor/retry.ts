// Retry logic with an exponential backoff.
//
// options:
//  baseTimeout: time for initial reconnect attempt (ms).
//  exponent: exponential factor to increase timeout each attempt.
//  maxTimeout: maximum time between retries (ms).
//  minCount: how many times to reconnect "instantly".
//  minTimeout: time to wait for the first `minCount` retries (ms).
//  fuzz: factor to randomize retry times by (to avoid retry storms).
import { Random } from '@rocket.chat/random';

import { Package } from './package-registry';

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
		// The default is high-ish to ensure a server can recover from a
		// failure caused by load.
		maxTimeout = 5 * 60 * 1000,
		minTimeout = 10,
		minCount = 2,
		fuzz = 0.5,
	} = {}) {
		this.baseTimeout = baseTimeout;
		this.exponent = exponent;
		this.maxTimeout = maxTimeout;
		this.minTimeout = minTimeout;
		this.minCount = minCount;
		this.fuzz = fuzz;
		this.retryTimer = null;
	}

	// Reset a pending retry, if any.
	clear() {
		if (this.retryTimer) {
			clearTimeout(this.retryTimer);
		}
		this.retryTimer = null;
	}

	// Calculate how long to wait in milliseconds to retry, based on the
	// `count` of which retry this is.
	_timeout(count: number) {
		if (count < this.minCount) {
			return this.minTimeout;
		}

		// fuzz the timeout randomly, to avoid reconnect storms when a
		// server goes down.
		return (
			Math.min(this.maxTimeout, this.baseTimeout * Math.pow(this.exponent, count)) * (Random.fraction() * this.fuzz + (1 - this.fuzz / 2))
		);
	}

	// Call `fn` after a delay, based on the `count` of which retry this is.
	retryLater(count: number, fn: () => void) {
		const timeout = this._timeout(count);
		if (this.retryTimer) clearTimeout(this.retryTimer);
		this.retryTimer = setTimeout(fn, timeout);
		return timeout;
	}
}

Package.retry = {
	Retry,
};
