export type PromiseWaiterData = {
	done: boolean;
	promise: Promise<void>;
	promiseReject: (error: Error) => void;
	promiseResolve: () => void;
	timeout: ReturnType<typeof setTimeout> | null;
};

export type PromiseWaiterParams = {
	timeout?: number;
	timeoutFn?: () => void;
	cleanupFn?: () => void;
};

export function getExternalWaiter({ timeout, timeoutFn, cleanupFn }: PromiseWaiterParams = {}): PromiseWaiterData {
	const data: Partial<PromiseWaiterData> = {
		timeout: null,
		done: false,
	};

	const flagAsDone = () => {
		if (data.done) {
			return;
		}

		if (data.timeout) {
			clearTimeout(data.timeout);
			data.timeout = null;
		}
		data.done = true;
		cleanupFn?.();
	};

	data.promise = new Promise((resolve, reject) => {
		data.promiseResolve = () => {
			if (data.done) {
				return;
			}

			flagAsDone();
			resolve();
		};
		data.promiseReject = (error: Error) => {
			if (data.done) {
				return;
			}
			flagAsDone();
			reject(error);
		};
	});

	if (timeout) {
		data.timeout = setTimeout(() => {
			data.timeout = null;
			if (data.done) {
				return;
			}

			if (timeoutFn) {
				timeoutFn();
			}

			if (data.promiseReject && !data.done) {
				data.promiseReject(new Error('timeout'));
			}
		}, timeout);
	}

	return data as PromiseWaiterData;
}
