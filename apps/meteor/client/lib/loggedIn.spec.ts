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
	beforeEach(() => {
		jest.mocked(getUserId).mockReturnValue(undefined);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('reports a rejected callback without blocking the login hook', async () => {
		let loginHandler: (() => void) | undefined;
		const stop = jest.fn();
		jest.mocked(getDdpSdk).mockReturnValue({
			account: {
				onLogin: (handler: () => void) => {
					loginHandler = handler;
					return stop;
				},
			},
		} as unknown as ReturnType<typeof getDdpSdk>);

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
});
