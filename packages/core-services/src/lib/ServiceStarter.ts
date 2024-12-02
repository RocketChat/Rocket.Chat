// This class is used to manage calls to a service's .start and .stop functions
// Specifically for cases where the start function has different conditions that may cause the service to actually start or not,
// or when the start process can take a while to complete
// Using this class, you ensure that calls to .start and .stop will be chained, so you avoid race conditions
// At the same time, it prevents those functions from running more times than necessary if there are several calls to them (for example when loading setting values)
export class ServiceStarter {
	#lock = Promise.resolve();

	#currentCall?: 'start' | 'stop';

	#nextCall?: 'start' | 'stop';

	#starterFn: () => Promise<void>;

	#stopperFn?: () => Promise<void>;

	constructor(starterFn: () => Promise<void>, stopperFn?: () => Promise<void>) {
		this.#starterFn = starterFn;
		this.#stopperFn = stopperFn;
	}

	async #checkStatus(): Promise<void> {
		if (this.#nextCall === 'start') {
			return this.#doCall('start');
		}

		if (this.#nextCall === 'stop') {
			return this.#doCall('stop');
		}
	}

	async #doCall(call: 'start' | 'stop'): Promise<void> {
		this.#nextCall = undefined;
		this.#currentCall = call;
		try {
			if (call === 'start') {
				await this.#starterFn();
			} else if (this.#stopperFn) {
				await this.#stopperFn();
			}
		} finally {
			this.#currentCall = undefined;
			await this.#checkStatus();
		}
	}

	async #call(call: 'start' | 'stop'): Promise<void> {
		// If something is already chained to run after the current call, it's okay to replace it with the new call
		this.#nextCall = call;
		if (this.#currentCall) {
			return this.#lock;
		}
		this.#lock = this.#lock.then(() => this.#checkStatus());
		return this.#lock;
	}

	async start(): Promise<void> {
		return this.#call('start');
	}

	async stop(): Promise<void> {
		return this.#call('stop');
	}

	async wait(): Promise<void> {
		return this.#lock;
	}
}
