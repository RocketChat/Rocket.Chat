import type { userIdStore as UserIdStore } from '../lib/user';

const mockLogin = jest.fn();

jest.mock('../lib/sdk/ddpSdk', () => ({
	getDdpSdk: () => ({
		connection: { status: 'connected' },
		client: { callAsyncWithOptions: mockLogin },
		account: { clearCredentials: jest.fn() },
	}),
}));

const loadAccounts = (): { userIdStore: typeof UserIdStore; accounts: typeof import('./accounts') } => {
	let loaded!: { userIdStore: typeof UserIdStore; accounts: typeof import('./accounts') };
	jest.isolateModules(() => {
		const { userIdStore } = jest.requireActual<typeof import('../lib/user')>('../lib/user');
		loaded = { userIdStore, accounts: jest.requireActual<typeof import('./accounts')>('./accounts') };
	});
	return loaded;
};

describe('page load resume', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers();
		localStorage.setItem('Meteor.userId', 'user-id');
		localStorage.setItem('Meteor.loginToken', 'token');
	});

	afterEach(() => {
		jest.useRealTimers();
		localStorage.clear();
	});

	it('keeps the stored user when the resume fails for a reason other than the token', async () => {
		mockLogin.mockRejectedValue({ error: 'error-service-unavailable' });

		const { userIdStore, accounts } = loadAccounts();
		await jest.advanceTimersByTimeAsync(0);

		expect(mockLogin).toHaveBeenCalled();
		// Between two resume attempts no login is in progress, which is when a missing user would read as a logout.
		expect(accounts.isLoggingIn()).toBe(false);
		expect(userIdStore.getState()).toBe('user-id');
		expect(localStorage.getItem('Meteor.loginToken')).toBe('token');
	});

	it('logs out when the server refuses the stored token', async () => {
		mockLogin.mockRejectedValue({ error: 401, reason: "You've been logged out by the server. Please log in again." });

		const { userIdStore } = loadAccounts();
		await jest.advanceTimersByTimeAsync(0);

		expect(userIdStore.getState()).toBeUndefined();
		expect(localStorage.getItem('Meteor.loginToken')).toBeNull();
	});
});
