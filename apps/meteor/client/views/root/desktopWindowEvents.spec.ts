/**
 * Contract test for the window events that the Rocket.Chat Desktop app reads.
 *
 * The desktop preload listens on `window` for these CustomEvents to drive the
 * dock/taskbar badge, the login state and its boot watchdog (a workspace that
 * never fires `startup` is reloaded). Desktop versions in the field cannot be
 * updated together with the server, so renaming one of these events, changing
 * its payload or no longer firing it breaks those desktops silently.
 *
 * If this spec fails because of an intended change, keep the old event firing
 * as well, and coordinate the change with the desktop app.
 */
import type { DesktopWindowEvent } from '@rocket.chat/desktop-api';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { useCustomScript } from './MainLayout/useCustomScript';
import { useUnread } from './hooks/loggedIn/useUnread';
import { useStartupEvent } from './hooks/useStartupEvent';
import { createFakeSubscription } from '../../../tests/mocks/data';

const DESKTOP_WINDOW_EVENTS = [
	'startup',
	'unread-changed',
	'unread-changed-by-subscription',
	'status-changed',
	'Custom_Script_Logged_In',
	'Custom_Script_Logged_Out',
] as const satisfies readonly DesktopWindowEvent[];

let received: { type: DesktopWindowEvent; detail: unknown }[] = [];

const record = (event: Event) => {
	received.push({ type: event.type as DesktopWindowEvent, detail: (event as CustomEvent).detail });
};

const eventsOf = (type: DesktopWindowEvent) => received.filter((event) => event.type === type);

jest.mock('../../lib/settings', () => ({
	settings: { peek: () => undefined },
}));

beforeEach(() => {
	received = [];
	DESKTOP_WINDOW_EVENTS.forEach((type) => window.addEventListener(type, record));
});

afterEach(() => {
	DESKTOP_WINDOW_EVENTS.forEach((type) => window.removeEventListener(type, record));
});

let mockLoggedInCallbacks: (() => unknown)[];
let mockUsersListeners: (() => void)[];
let mockUsers: Map<string, { _id: string; status: string }>;

const loadStartup = () => {
	mockLoggedInCallbacks = [];
	mockUsersListeners = [];
	mockUsers = new Map();

	jest.doMock('../../lib/SDKClient', () => ({ sdk: { rest: { post: jest.fn() } } }));
	jest.doMock('../../lib/loggedIn', () => ({
		onLoggedIn: (callback: () => unknown) => mockLoggedInCallbacks.push(callback),
	}));
	jest.doMock('../../lib/sdk/ddpSdk', () => ({
		clearStoredCredentials: jest.fn(),
		ensureConnectedAndAuthenticated: jest.fn(async () => undefined),
		getDdpSdk: () => ({ account: { onLogout: jest.fn() } }),
		isAuthError: jest.fn(),
	}));
	jest.doMock('../../lib/sdk/storage', () => ({ STORAGE_KEYS: {}, getStoredItem: () => 'token' }));
	jest.doMock('../../lib/user', () => ({ userIdStore: { getState: () => 'uid', subscribe: jest.fn() } }));
	jest.doMock('../../lib/userData', () => ({
		removeLocalUserData: jest.fn(),
		synchronizeUserData: async () => ({ _id: 'uid', status: 'online', utcOffset: -new Date().getTimezoneOffset() / 60 }),
	}));
	jest.doMock('../../stores', () => ({
		Users: {
			use: {
				getState: () => mockUsers,
				subscribe: (listener: () => void) => mockUsersListeners.push(listener),
			},
		},
	}));

	jest.isolateModules(() => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		require('../../startup/startup');
	});
};

// One entry per event: the `Record` type makes a missing event a compile error.
const scenarios: Record<DesktopWindowEvent, () => void> = {
	'startup': () => {
		it('should fire with `true` when the app layout mounts', async () => {
			renderHook(() => useStartupEvent(), { wrapper: mockAppRoot().build() });

			await waitFor(() => expect(eventsOf('startup')).toEqual([{ type: 'startup', detail: true }]));
		});
	},

	'unread-changed': () => {
		it('should fire with the total unread count', async () => {
			renderHook(() => useUnread(), {
				wrapper: mockAppRoot()
					.withSubscriptions([
						createFakeSubscription({ unread: 2, alert: true, open: true }),
						createFakeSubscription({ unread: 3, alert: true, open: true }),
					])
					.build(),
			});

			await waitFor(() => expect(eventsOf('unread-changed').at(-1)).toEqual({ type: 'unread-changed', detail: 5 }));
		});
	},

	'unread-changed-by-subscription': () => {
		it('should fire with the subscription', async () => {
			const subscription = createFakeSubscription({ unread: 4, alert: true, open: true });

			renderHook(() => useUnread(), {
				wrapper: mockAppRoot().withSubscriptions([subscription]).build(),
			});

			await waitFor(() =>
				expect(eventsOf('unread-changed-by-subscription').at(-1)?.detail).toMatchObject({
					rid: subscription.rid,
					unread: 4,
					alert: true,
				}),
			);
		});
	},

	'status-changed': () => {
		it('should fire with the user status after login', async () => {
			loadStartup();
			await Promise.all(mockLoggedInCallbacks.map((callback) => callback()));

			await waitFor(() => expect(eventsOf('status-changed')).toEqual([{ type: 'status-changed', detail: 'online' }]));
		});

		it('should fire when the status of the user changes', () => {
			loadStartup();
			mockUsers.set('uid', { _id: 'uid', status: 'away' });
			mockUsersListeners.forEach((listener) => listener());

			expect(eventsOf('status-changed')).toEqual([{ type: 'status-changed', detail: 'away' }]);
		});
	},

	'Custom_Script_Logged_In': () => {
		it('should fire when a user is logged in', () => {
			// oxlint-disable-next-line react-hooks/rules-of-hooks -- oxlint takes the capitalized scenario key for a component name
			renderHook(() => useCustomScript(), {
				wrapper: mockAppRoot()
					.withUser({ _id: 'uid' } as any)
					.build(),
			});

			expect(eventsOf('Custom_Script_Logged_In')).toEqual([{ type: 'Custom_Script_Logged_In', detail: null }]);
			expect(eventsOf('Custom_Script_Logged_Out')).toEqual([]);
		});
	},

	'Custom_Script_Logged_Out': () => {
		it('should fire when no user is logged in', () => {
			// oxlint-disable-next-line react-hooks/rules-of-hooks -- oxlint takes the capitalized scenario key for a component name
			renderHook(() => useCustomScript(), { wrapper: mockAppRoot().build() });

			expect(eventsOf('Custom_Script_Logged_Out')).toEqual([{ type: 'Custom_Script_Logged_Out', detail: null }]);
			expect(eventsOf('Custom_Script_Logged_In')).toEqual([]);
		});
	},
};

describe('window events read by the desktop app', () => {
	Object.entries(scenarios).forEach(([type, scenario]) =>
		describe(`"${type}"`, () => {
			scenario();
		}),
	);
});
