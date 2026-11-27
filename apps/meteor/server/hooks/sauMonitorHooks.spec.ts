import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import type { ILoginAttempt } from '../lib/auth/ILoginAttempt';
import { deviceManagementEvents } from '../services/device-management/events';
import { sauEvents } from '../services/sauMonitor/events';

jest.mock(
	'meteor/accounts-base',
	() => ({
		Accounts: {
			onLogin: jest.fn(),
			onLogout: jest.fn(),
		},
	}),
	{ virtual: true },
);

jest.mock(
	'meteor/meteor',
	() => ({
		Meteor: {
			onConnection: jest.fn(),
		},
	}),
	{ virtual: true },
);

jest.mock(
	'@rocket.chat/instance-status',
	() => ({
		InstanceStatus: {
			id: jest.fn(() => 'instance-1'),
		},
	}),
	{ virtual: true },
);

jest.mock(
	'@rocket.chat/account-utils',
	() => ({
		hashLoginToken: jest.fn((token: string) => `hashed:${token}`),
	}),
	{ virtual: true },
);

jest.mock(
	'@rocket.chat/tools',
	() => ({
		getHeader: jest.fn((headers: Record<string, unknown> | undefined, key: string) => {
			const value = headers?.[key];
			return typeof value === 'string' ? value : '';
		}),
	}),
	{ virtual: true },
);

jest.mock('../services/sauMonitor/events', () => ({
	sauEvents: {
		emit: jest.fn(),
	},
}));

jest.mock('../services/device-management/events', () => ({
	deviceManagementEvents: {
		emit: jest.fn(),
	},
}));

describe('sauMonitorHooks', () => {
	let onLoginCallback: (info: ILoginAttempt) => void;
	let onLogoutCallback: (info: { user?: { _id: string }; connection?: { id?: string } | null }) => void;

	const baseAttempt = (overrides: Partial<ILoginAttempt> = {}): ILoginAttempt =>
		({
			type: 'password',
			allowed: true,
			methodName: 'login',
			methodArguments: [],
			connection: {
				id: 'conn-1',
				clientAddress: '203.0.113.10',
				httpHeaders: {
					'user-agent': 'RC Mobile; ios 18.4.1',
					'host': 'chat.example.com',
				},
			},
			user: { _id: 'user-1' },
			...overrides,
		}) as unknown as ILoginAttempt;

	beforeAll(async () => {
		await import('./sauMonitorHooks');
		onLoginCallback = jest.mocked(Accounts.onLogin).mock.calls[0][0] as unknown as (info: ILoginAttempt) => void;
		onLogoutCallback = jest.mocked(Accounts.onLogout).mock.calls[0][0] as unknown as typeof onLogoutCallback;
	});

	beforeEach(() => {
		jest.mocked(sauEvents.emit).mockClear();
		jest.mocked(deviceManagementEvents.emit).mockClear();
	});

	it('registers Accounts and Meteor hooks', () => {
		expect(onLoginCallback).toEqual(expect.any(Function));
		expect(onLogoutCallback).toEqual(expect.any(Function));
		expect(jest.mocked(Meteor.onConnection)).toHaveBeenCalledTimes(2);
	});

	it('does not throw when methodArguments contains primitive or nullish values (e.g. verifyEmail token)', () => {
		const attempt = baseAttempt({
			methodName: 'verifyEmail',
			methodArguments: [
				'tH6-PKwcCTtwXd3gNy4rlUkbTOhdaxa3reLahq55VdO',
				null,
				undefined,
				42,
				true,
			] as unknown as ILoginAttempt['methodArguments'],
		});

		expect(() => onLoginCallback(attempt)).not.toThrow();

		expect(sauEvents.emit).toHaveBeenCalledWith('sau.accounts.login', {
			userId: 'user-1',
			instanceId: 'instance-1',
			userAgent: 'RC Mobile; ios 18.4.1',
			loginToken: '',
			connectionId: 'conn-1',
			clientAddress: '203.0.113.10',
			host: 'chat.example.com',
		});

		expect(deviceManagementEvents.emit).toHaveBeenCalledWith('device-login', {
			userId: 'user-1',
			userAgent: 'RC Mobile; ios 18.4.1',
			clientAddress: '203.0.113.10',
		});
	});

	it('ignores non-array methodArguments and non-string resume values without throwing', () => {
		expect(() =>
			onLoginCallback(
				baseAttempt({
					methodArguments: undefined as unknown as ILoginAttempt['methodArguments'],
				}),
			),
		).not.toThrow();

		expect(() =>
			onLoginCallback(
				baseAttempt({
					methodArguments: [{ resume: { invalid: true } }] as unknown as ILoginAttempt['methodArguments'],
				}),
			),
		).not.toThrow();

		expect(sauEvents.emit).toHaveBeenNthCalledWith(
			1,
			'sau.accounts.login',
			expect.objectContaining({
				loginToken: '',
			}),
		);
		expect(sauEvents.emit).toHaveBeenNthCalledWith(
			2,
			'sau.accounts.login',
			expect.objectContaining({
				loginToken: '',
			}),
		);
		expect(deviceManagementEvents.emit).toHaveBeenCalledTimes(2);
	});

	it('hashes valid resume token and skips device-login emission', () => {
		const attempt = baseAttempt({
			methodArguments: [{ resume: 'raw-resume-token' }],
		});

		onLoginCallback(attempt);

		expect(sauEvents.emit).toHaveBeenCalledWith(
			'sau.accounts.login',
			expect.objectContaining({
				userId: 'user-1',
				loginToken: 'hashed:raw-resume-token',
			}),
		);
		expect(deviceManagementEvents.emit).not.toHaveBeenCalled();
	});

	it('handles missing user and missing connection safely on login and logout', () => {
		expect(() =>
			onLoginCallback(baseAttempt({ user: undefined, connection: undefined as unknown as ILoginAttempt['connection'] })),
		).not.toThrow();
		expect(() => onLogoutCallback({ user: undefined })).not.toThrow();
		expect(sauEvents.emit).not.toHaveBeenCalled();

		expect(() =>
			onLoginCallback(
				baseAttempt({
					methodArguments: [],
					connection: undefined as unknown as ILoginAttempt['connection'],
				}),
			),
		).not.toThrow();

		expect(sauEvents.emit).toHaveBeenCalledWith('sau.accounts.login', {
			userId: 'user-1',
			instanceId: 'instance-1',
			userAgent: '',
			loginToken: '',
			connectionId: '',
			clientAddress: '',
			host: '',
		});

		expect(() => onLogoutCallback({ user: { _id: 'user-1' }, connection: undefined })).not.toThrow();
		expect(sauEvents.emit).toHaveBeenCalledWith('sau.accounts.logout', {
			userId: 'user-1',
			sessionId: '',
		});
	});

	it('forwards Meteor connection connect and close events', async () => {
		const [onDisconnectRegistrar, onConnectHandler] = jest.mocked(Meteor.onConnection).mock.calls.map(([cb]) => cb);

		const onCloseHandlers: Array<() => Promise<void> | void> = [];
		const connection = {
			id: 'socket-1',
			onClose: jest.fn((cb: () => Promise<void> | void) => {
				onCloseHandlers.push(cb);
			}),
		};

		onDisconnectRegistrar(connection as unknown as Parameters<typeof onDisconnectRegistrar>[0]);
		onConnectHandler(connection as unknown as Parameters<typeof onConnectHandler>[0]);

		expect(sauEvents.emit).toHaveBeenCalledWith('sau.socket.connected', {
			instanceId: 'instance-1',
			connectionId: 'socket-1',
		});

		await onCloseHandlers[0]();
		expect(sauEvents.emit).toHaveBeenCalledWith('sau.socket.disconnected', {
			connectionId: 'socket-1',
			instanceId: 'instance-1',
		});
	});
});
