function createDeferredPromise<R = void>() {
	let resolve!: (value: R | PromiseLike<R>) => void;
	let reject!: (reason?: unknown) => void;

	const promise = new Promise<R>((res, rej) => {
		resolve = res;
		reject = rej;
	});

	return { promise, resolve, reject };
}

function createDeferredMockFn<R = void>() {
	const deferred = createDeferredPromise<R>();
	const fn = jest.fn(() => deferred.promise);
	return { ...deferred, fn };
}

export default createDeferredMockFn;
