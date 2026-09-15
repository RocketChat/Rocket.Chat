import { onLoggedIn } from './loggedIn';
import { getDdpSdk } from './sdk/ddpSdk';
import { getUserId } from './user';

jest.mock('./sdk/ddpSdk', () => ({
	getDdpSdk: jest.fn(),
}));

jest.mock('./user', () => ({
	getUserId: jest.fn(),
}));

describe('onLoggedIn', () => {
	let loginHandler: (() => void) | undefined;
	let stop = jest.fn();

	beforeEach(() => {
		loginHandler = undefined;
		stop = jest.fn();
		jest.mocked(getUserId).mockReturnValue(undefined);
		jest.mocked(getDdpSdk).mockReturnValue({
			account: {
				onLogin: (handler: () => void) => {
					loginHandler = handler;
					return stop;
				},
			},
		} as unknown as ReturnType<typeof getDdpSdk>);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('reports a rejected callback without blocking the login hook', async () => {
		const error = new Error('login callback failed');
		const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
		const unsubscribe = onLoggedIn(() => Promise.reject(error));

		loginHandler?.();
		await Promise.resolve();
		await Promise.resolve();

		expect(consoleError).toHaveBeenCalledWith(error);

		unsubscribe();
		expect(stop).toHaveBeenCalledTimes(1);
	});

	it('runs an async cleanup that resolves after unsubscribing', async () => {
		let resolveCleanup: (cleanup: () => void) => void = () => undefined;
		const cleanupPromise = new Promise<() => void>((resolve) => {
			resolveCleanup = resolve;
		});
		const cleanup = jest.fn();
		const unsubscribe = onLoggedIn(() => cleanupPromise);

		loginHandler?.();
		unsubscribe();
		resolveCleanup(cleanup);
		await Promise.resolve();
		await Promise.resolve();

		expect(cleanup).toHaveBeenCalledTimes(1);
	});

	it('disposes a stale async cleanup without replacing the current cleanup', async () => {
		let resolveFirstCleanup: (cleanup: () => void) => void = () => undefined;
		const firstCleanupPromise = new Promise<() => void>((resolve) => {
			resolveFirstCleanup = resolve;
		});
		let resolveSecondCleanup: (cleanup: () => void) => void = () => undefined;
		const secondCleanupPromise = new Promise<() => void>((resolve) => {
			resolveSecondCleanup = resolve;
		});
		const staleCleanup = jest.fn();
		const currentCleanup = jest.fn();
		const callback = jest.fn().mockReturnValueOnce(firstCleanupPromise).mockReturnValueOnce(secondCleanupPromise);
		const unsubscribe = onLoggedIn(callback);

		loginHandler?.();
		loginHandler?.();
		resolveSecondCleanup(currentCleanup);
		await Promise.resolve();
		await Promise.resolve();
		resolveFirstCleanup(staleCleanup);
		await Promise.resolve();
		await Promise.resolve();

		expect(staleCleanup).toHaveBeenCalledTimes(1);
		expect(currentCleanup).not.toHaveBeenCalled();

		unsubscribe();
		expect(staleCleanup).toHaveBeenCalledTimes(1);
		expect(currentCleanup).toHaveBeenCalledTimes(1);
	});

	it('reports cleanup errors without interrupting the next login callback', async () => {
		const error = new Error('cleanup failed');
		const cleanup = jest.fn(() => {
			throw error;
		});
		const callback = jest.fn().mockReturnValueOnce(cleanup).mockReturnValueOnce(undefined);
		const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
		const unsubscribe = onLoggedIn(callback);

		loginHandler?.();
		await Promise.resolve();
		await Promise.resolve();

		expect(() => loginHandler?.()).not.toThrow();
		await Promise.resolve();
		await Promise.resolve();

		expect(callback).toHaveBeenCalledTimes(2);
		expect(consoleError).toHaveBeenCalledWith(error);

		unsubscribe();
	});
});
