import { UserStatus } from '@rocket.chat/core-typings';
import type { IUser } from '@rocket.chat/core-typings';
import type { IRocketChatDesktop } from '@rocket.chat/desktop-api';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { clientCallbacks } from '@rocket.chat/ui-client';
import { AuthenticationContext, UserContext } from '@rocket.chat/ui-contexts';
import { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createElement, useContext } from 'react';
import type { ReactNode } from 'react';

import { useDesktopUserPresence } from './useDesktopUserPresence';

const user = {
	_id: 'john.doe',
	username: 'john.doe',
	status: UserStatus.BUSY,
	statusText: 'In a meeting',
	statusExpiresAt: new Date('2026-10-19T18:00:00.000Z'),
} as IUser;

const setUserPresenceState = jest.fn();
const setUserStatusChangeHandler = jest.fn();

const runCallbacks = jest.spyOn(clientCallbacks, 'run');

beforeEach(() => {
	runCallbacks.mockClear();
	setUserPresenceState.mockClear();
	setUserStatusChangeHandler.mockClear();
	window.RocketChatDesktop = { setUserPresenceState, setUserStatusChangeHandler } as unknown as IRocketChatDesktop;
});

afterAll(() => {
	delete window.RocketChatDesktop;
});

const lastPresence = () => setUserPresenceState.mock.lastCall?.[0];

const customStatuses = () => ({
	statuses: [
		{ _id: 'meeting', name: 'In a meeting', statusType: UserStatus.BUSY, _updatedAt: '2026-10-19T00:00:00.000Z' },
		{ _id: 'hidden', name: 'Hidden', statusType: UserStatus.OFFLINE, _updatedAt: '2026-10-19T00:00:00.000Z' },
	],
	count: 2,
	offset: 0,
	total: 2,
});

const renderWithStatusesLoaded = async (root: ReturnType<typeof mockAppRoot>) => {
	const queryClient = new QueryClient();
	renderHook(() => useDesktopUserPresence(), {
		wrapper: root.withQueryClient(queryClient).withEndpoint('GET', '/v1/custom-user-status.list', customStatuses).build(),
	});
	await waitFor(() => expect(queryClient.getQueryState(['user-statuses'])?.status).toBe('success'));
	await act(async () => undefined);
};

// Keeps the user id of a session and serves the user record from `record`, as the client does while it resumes a session.
const renderWithUserRecord = (initialRecord: IUser | null) => {
	let record = initialRecord;
	const AppRoot = mockAppRoot().withAnonymous().build();
	const Session = ({ children }: { children: ReactNode }) =>
		createElement(UserContext.Provider, { value: { ...useContext(UserContext), userId: user._id, user: record } }, children);

	const { rerender } = renderHook(() => useDesktopUserPresence(), {
		wrapper: ({ children }) => createElement(AppRoot, null, createElement(Session, null, children)),
	});

	return {
		setRecord: (nextRecord: IUser | null) => {
			record = nextRecord;
			rerender();
		},
	};
};

describe('useDesktopUserPresence', () => {
	it('sends the status, custom text, expiration and the statuses the user can select', async () => {
		renderHook(() => useDesktopUserPresence(), {
			wrapper: mockAppRoot()
				.withUser(user)
				.withSetting('Accounts_AllowInvisibleStatusOption', false)
				.withEndpoint('GET', '/v1/custom-user-status.list', customStatuses)
				.build(),
		});

		await waitFor(() =>
			expect(lastPresence()).toEqual({
				loggedIn: true,
				connection: 'connected',
				status: 'busy',
				statusText: 'In a meeting',
				statusExpiresAt: '2026-10-19T18:00:00.000Z',
				availableStatuses: ['online', 'away', 'busy'],
				customStatuses: [{ id: 'meeting', name: 'In a meeting', status: 'busy' }],
			}),
		);
	});

	it('sends a logged-out snapshot when no user is logged in', () => {
		renderHook(() => useDesktopUserPresence(), { wrapper: mockAppRoot().withAnonymous().build() });

		expect(lastPresence()).toEqual({ loggedIn: false, connection: 'connected', availableStatuses: [], customStatuses: [] });
	});

	it('stays logged in while a resumed session loads the user record', () => {
		const { setRecord } = renderWithUserRecord(null);

		expect(lastPresence()).toEqual({ loggedIn: true, connection: 'connected', availableStatuses: [], customStatuses: [] });

		setRecord(user);

		expect(lastPresence()).toMatchObject({ loggedIn: true, status: 'busy', statusText: 'In a meeting' });
		expect(setUserPresenceState.mock.calls.map(([presence]) => presence.loggedIn)).not.toContain(false);
	});

	it('reports no logout while a stored session resumes', () => {
		let isLoggingIn = true;
		const AppRoot = mockAppRoot().withAnonymous().build();
		const Authentication = ({ children }: { children: ReactNode }) =>
			createElement(AuthenticationContext.Provider, { value: { ...useContext(AuthenticationContext), isLoggingIn } }, children);

		const { rerender } = renderHook(() => useDesktopUserPresence(), {
			wrapper: ({ children }) => createElement(AppRoot, null, createElement(Authentication, null, children)),
		});

		expect(setUserPresenceState.mock.calls.map(([presence]) => presence.loggedIn)).not.toContain(false);

		isLoggingIn = false;
		rerender();

		expect(lastPresence()).toMatchObject({ loggedIn: false });
	});

	it.each([
		['the workspace stops the presence broadcast', mockAppRoot().withUser(user).withSetting('Presence_broadcast_disabled', true)],
		['the workspace disables user status', mockAppRoot().withUser(user).withSetting('Accounts_UserStatus_Enabled', false)],
		[
			'an administrator disables presence for the user',
			mockAppRoot()
				.withUser({ ...user, presenceDisabledByAdmin: true })
				.withSetting('Accounts_StatusVisibility_Admin_Enabled', true),
		],
	])('offers no status when %s', async (_, root) => {
		await renderWithStatusesLoaded(root);

		expect(lastPresence()).toMatchObject({ availableStatuses: [], customStatuses: [] });
	});

	it('offers no custom status when the workspace blocks status messages', async () => {
		await renderWithStatusesLoaded(mockAppRoot().withUser(user).withSetting('Accounts_AllowUserStatusMessageChange', false));

		expect(lastPresence()).toMatchObject({ availableStatuses: ['online', 'away', 'busy', 'offline'], customStatuses: [] });
	});

	it('leaves a desktop app without the presence contract untouched', () => {
		const olderDesktopSetUserPresence = jest.fn();
		window.RocketChatDesktop = { setUserPresence: olderDesktopSetUserPresence } as unknown as IRocketChatDesktop;

		renderHook(() => useDesktopUserPresence(), { wrapper: mockAppRoot().withUser(user).build() });

		expect(olderDesktopSetUserPresence).not.toHaveBeenCalled();
	});

	it.each([
		['a browser without the desktop bridge', undefined],
		['a desktop app without the presence contract', { setUserPresence: jest.fn() }],
	])('does not load the custom statuses in %s', async (_name, bridge) => {
		if (bridge) {
			window.RocketChatDesktop = bridge as unknown as IRocketChatDesktop;
		} else {
			delete window.RocketChatDesktop;
		}
		const listStatuses = jest.fn(customStatuses);

		renderHook(() => useDesktopUserPresence(), {
			wrapper: mockAppRoot().withUser(user).withEndpoint('GET', '/v1/custom-user-status.list', listStatuses).build(),
		});
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(listStatuses).not.toHaveBeenCalled();
	});

	it('runs in a browser without the desktop bridge', () => {
		delete window.RocketChatDesktop;

		let session: ReturnType<typeof renderWithUserRecord> | undefined;
		expect(() => {
			session = renderWithUserRecord(user);
		}).not.toThrow();
		expect(() => session?.setRecord({ ...user, status: UserStatus.AWAY, statusText: '' })).not.toThrow();
	});

	it.each(['setUserStatusChangeHandler', 'setUserPresenceState'] as const)(
		'does not crash the React tree when the desktop bridge throws from %s',
		(member) => {
			const desktopError = new Error('desktop bridge failure');
			const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
			window.RocketChatDesktop = {
				setUserPresenceState,
				setUserStatusChangeHandler,
				[member]: jest.fn(() => {
					throw desktopError;
				}),
			} as unknown as IRocketChatDesktop;

			try {
				expect(() => renderHook(() => useDesktopUserPresence(), { wrapper: mockAppRoot().withUser(user).build() })).not.toThrow();
				expect(warn).toHaveBeenCalledWith(expect.any(String), desktopError);
			} finally {
				warn.mockRestore();
			}
		},
	);

	it.each([
		['connecting', 'connecting'],
		['waiting', 'connecting'],
		['failed', 'disconnected'],
	] as const)('reports the %s connection as %s', (status, connection) => {
		renderHook(() => useDesktopUserPresence(), {
			wrapper: mockAppRoot().withUser(user).withConnectionStatus({ status, connected: false }).build(),
		});

		expect(lastPresence().connection).toBe(connection);
	});

	it('changes the status through the user menu flow, which removes the custom text', async () => {
		const setStatus = jest.fn(() => null);
		renderHook(() => useDesktopUserPresence(), {
			wrapper: mockAppRoot().withUser(user).withEndpoint('POST', '/v1/users.setStatus', setStatus).build(),
		});

		const handler = setUserStatusChangeHandler.mock.lastCall?.[0];
		await handler({ status: 'away' });

		expect(setStatus).toHaveBeenCalledWith({ status: 'away', message: '' });
		expect(runCallbacks).toHaveBeenCalledWith('userStatusManuallySet', expect.objectContaining({ statusType: 'away' }));
	});

	it('applies a custom status by its id, with its name as the text', async () => {
		const setStatus = jest.fn(() => null);
		renderHook(() => useDesktopUserPresence(), {
			wrapper: mockAppRoot()
				.withUser(user)
				.withEndpoint('GET', '/v1/custom-user-status.list', customStatuses)
				.withEndpoint('POST', '/v1/users.setStatus', setStatus)
				.build(),
		});
		await waitFor(() => expect(lastPresence().customStatuses).toHaveLength(2));

		const handler = setUserStatusChangeHandler.mock.lastCall?.[0];
		await handler({ status: 'busy', customStatusId: 'meeting' });

		expect(setStatus).toHaveBeenCalledWith({ status: 'busy', message: 'In a meeting' });
	});

	it('rejects when the server refuses the change', async () => {
		renderHook(() => useDesktopUserPresence(), {
			wrapper: mockAppRoot()
				.withUser(user)
				.withEndpoint('POST', '/v1/users.setStatus', async () => {
					throw new Error('error-status-not-allowed');
				})
				.build(),
		});

		const handler = setUserStatusChangeHandler.mock.lastCall?.[0];

		await expect(handler({ status: 'offline' })).rejects.toThrow('error-status-not-allowed');
	});
});
