import { waitFor } from '@testing-library/react';

jest.mock('@rocket.chat/ddp-client', () => ({
	DDPSDK: {
		create: () => ({
			connection: { status: 'connected', connect: () => new Promise(() => undefined), whenConnected: () => Promise.resolve() },
			account: { loginWithToken: jest.fn(), emit: jest.fn(), onLogin: () => () => undefined, onLogout: jest.fn() },
		}),
	},
}));

jest.mock('../meteor/accounts', () => ({
	clearLocalSession: jest.fn(),
	isLoggingIn: () => false,
	onEmailVerificationLink: jest.fn(),
	onPageLoadLogin: jest.fn(),
	resumeStoredSession: jest.fn(),
	subscribeLoggingIn: jest.fn(),
}));

jest.mock('../lib/userData', () => ({ synchronizeUserData: jest.fn(), removeLocalUserData: jest.fn() }));

const startWithStoredSession = (failSync: () => Promise<never>) => {
	localStorage.setItem('Meteor.loginToken', 'stored-token');
	let modules: { clearLocalSession: jest.Mock } | undefined;
	jest.isolateModules(() => {
		jest.requireMock('../lib/userData').synchronizeUserData.mockImplementation(failSync);
		const { userIdStore } = jest.requireActual('../lib/user');
		jest.requireActual('./startup');
		userIdStore.setState('user-id');
		modules = { clearLocalSession: jest.requireMock('../meteor/accounts').clearLocalSession };
	});
	return modules as { clearLocalSession: jest.Mock };
};

const whenSyncFailed = () =>
	waitFor(() => expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('runUserDataSync failed'), expect.anything()));

describe('startup', () => {
	beforeEach(() => {
		jest.spyOn(console, 'warn').mockImplementation(() => undefined);
		localStorage.clear();
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('should drop the session when the server refuses the stored token on page load', async () => {
		const { clearLocalSession } = startWithStoredSession(() => Promise.reject({ status: 401 }));

		await whenSyncFailed();

		expect(clearLocalSession).toHaveBeenCalled();
	});

	it('should keep the session when another login replaced the token during the sync', async () => {
		const { clearLocalSession } = startWithStoredSession(() => {
			localStorage.setItem('Meteor.loginToken', 'new-token');
			return Promise.reject({ status: 401 });
		});

		await whenSyncFailed();

		expect(clearLocalSession).not.toHaveBeenCalled();
	});

	it('should keep the session when the sync fails for a reason other than the token', async () => {
		const { clearLocalSession } = startWithStoredSession(() => Promise.reject({ status: 500 }));

		await whenSyncFailed();

		expect(clearLocalSession).not.toHaveBeenCalled();
	});
});
