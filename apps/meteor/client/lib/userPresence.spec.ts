import type { IUser } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';
import { renderHook } from '@testing-library/react';

import { UserPresence } from './userPresence';

const IDLE_TIME_LIMIT = 300;
const IDLE_TIME_LIMIT_MS = IDLE_TIME_LIMIT * 1000;
const DEBOUNCE_WAIT = 1000;

const state = {
	connected: true,
	isLoggingIn: false,
	user: { _id: 'john.doe', status: UserStatus.ONLINE, statusDefault: UserStatus.ONLINE } as unknown as IUser | undefined,
	preferences: { enableAutoAway: true, idleTimeLimit: IDLE_TIME_LIMIT } as Record<string, unknown>,
};

const goOnline = jest.fn(async (): Promise<boolean | undefined> => true);
const goAway = jest.fn(async (): Promise<boolean | undefined> => true);
const storeUser = jest.fn();

jest.mock('@rocket.chat/ui-contexts', () => ({
	useUser: () => state.user,
	useConnectionStatus: () => ({ connected: state.connected }),
	useIsLoggingIn: () => state.isLoggingIn,
	useUserPreference: (key: string) => state.preferences[key],
	useMethod: (method: string) => (method === 'UserPresence:online' ? goOnline : goAway),
}));

jest.mock('../stores', () => ({
	Users: { use: (selector: (state: { store: unknown }) => unknown) => selector({ store: storeUser }) },
}));

describe('UserPresence', () => {
	let userPresence: UserPresence;

	beforeEach(() => {
		jest.useFakeTimers();
		jest.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

		goOnline.mockReset().mockResolvedValue(true);
		goAway.mockReset().mockResolvedValue(true);
		storeUser.mockReset();

		state.connected = true;
		state.isLoggingIn = false;
		state.user = { _id: 'john.doe', status: UserStatus.ONLINE, statusDefault: UserStatus.ONLINE } as unknown as IUser;
		state.preferences = { enableAutoAway: true, idleTimeLimit: IDLE_TIME_LIMIT };

		userPresence = new UserPresence();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	const render = () => renderHook(() => userPresence.use());

	const dropConnection = (rerender: () => void) => {
		state.connected = false;
		rerender();
	};

	const restoreConnection = (rerender: () => void) => {
		state.connected = true;
		rerender();
	};

	const goIdle = async () => {
		await jest.advanceTimersByTimeAsync(IDLE_TIME_LIMIT_MS + DEBOUNCE_WAIT);
	};

	it('should set the user away once the idle time limit is reached', async () => {
		render();

		await jest.advanceTimersByTimeAsync(IDLE_TIME_LIMIT_MS - 1000);
		expect(goAway).not.toHaveBeenCalled();

		await jest.advanceTimersByTimeAsync(1000 + DEBOUNCE_WAIT);
		expect(goAway).toHaveBeenCalledTimes(1);
	});

	it('should keep an idle user away after a reconnection', async () => {
		const { rerender } = render();

		await goIdle();
		expect(goAway).toHaveBeenCalledTimes(1);

		dropConnection(rerender);
		await jest.advanceTimersByTimeAsync(30_000);

		restoreConnection(rerender);
		await jest.advanceTimersByTimeAsync(0);

		expect(goAway).toHaveBeenCalledTimes(2);
		expect(goOnline).not.toHaveBeenCalled();
	});

	it('should not re-assert presence before the reconnected session is logged in', async () => {
		const { rerender } = render();

		await goIdle();
		expect(goAway).toHaveBeenCalledTimes(1);

		dropConnection(rerender);

		state.connected = true;
		state.isLoggingIn = true;
		rerender();
		await jest.advanceTimersByTimeAsync(0);
		expect(goAway).toHaveBeenCalledTimes(1);

		state.isLoggingIn = false;
		rerender();
		await jest.advanceTimersByTimeAsync(0);
		expect(goAway).toHaveBeenCalledTimes(2);
	});

	it('should bring the user back online on reconnection if they interacted while disconnected', async () => {
		const { rerender } = render();

		await goIdle();
		expect(goAway).toHaveBeenCalledTimes(1);

		dropConnection(rerender);

		document.dispatchEvent(new MouseEvent('mousemove'));

		restoreConnection(rerender);
		await jest.advanceTimersByTimeAsync(DEBOUNCE_WAIT);

		// the reconnected session is already online on the server, so nothing else has to be asserted
		expect(goAway).toHaveBeenCalledTimes(1);
	});

	it('should not restart the idle countdown from scratch on a reconnection', async () => {
		const { rerender } = render();

		await jest.advanceTimersByTimeAsync(IDLE_TIME_LIMIT_MS - 60_000);
		expect(goAway).not.toHaveBeenCalled();

		dropConnection(rerender);
		restoreConnection(rerender);
		await jest.advanceTimersByTimeAsync(0);

		// still online, but only the remaining minute of inactivity is left
		expect(goAway).not.toHaveBeenCalled();

		await jest.advanceTimersByTimeAsync(60_000 + DEBOUNCE_WAIT);
		expect(goAway).toHaveBeenCalledTimes(1);
	});

	it('should count the time spent disconnected as inactivity', async () => {
		const { rerender } = render();

		await jest.advanceTimersByTimeAsync(60_000);

		dropConnection(rerender);
		await jest.advanceTimersByTimeAsync(IDLE_TIME_LIMIT_MS);
		expect(goAway).not.toHaveBeenCalled();

		restoreConnection(rerender);
		await jest.advanceTimersByTimeAsync(0);

		expect(goAway).toHaveBeenCalledTimes(1);
	});

	it('should keep a desktop user away when the desktop app reported them idle while disconnected', async () => {
		let setUserOnline: ((online: boolean) => void) | undefined;

		Object.assign(window, {
			RocketChatDesktop: {
				setUserPresenceDetection: (options: { setUserOnline: (online: boolean) => void }) => {
					setUserOnline = options.setUserOnline;
				},
			},
		});

		try {
			const { rerender } = render();
			expect(setUserOnline).toBeDefined();

			dropConnection(rerender);

			setUserOnline?.(false);
			await jest.advanceTimersByTimeAsync(DEBOUNCE_WAIT);
			expect(goAway).not.toHaveBeenCalled();

			restoreConnection(rerender);
			await jest.advanceTimersByTimeAsync(0);

			expect(goAway).toHaveBeenCalledTimes(1);
		} finally {
			delete (window as { RocketChatDesktop?: unknown }).RocketChatDesktop;
		}
	});

	it('should not force the user away on reconnection when auto away is disabled', async () => {
		state.preferences = { enableAutoAway: false, idleTimeLimit: IDLE_TIME_LIMIT };

		const { rerender } = render();

		await jest.advanceTimersByTimeAsync(IDLE_TIME_LIMIT_MS * 2);

		dropConnection(rerender);
		restoreConnection(rerender);
		await jest.advanceTimersByTimeAsync(DEBOUNCE_WAIT);

		expect(goAway).not.toHaveBeenCalled();
	});

	it('should go online again after interacting with the UI', async () => {
		render();

		await goIdle();
		expect(goAway).toHaveBeenCalledTimes(1);

		document.dispatchEvent(new MouseEvent('mousemove'));
		await jest.advanceTimersByTimeAsync(DEBOUNCE_WAIT);

		expect(goOnline).toHaveBeenCalledTimes(1);

		// and goes away again after a new idle period
		await jest.advanceTimersByTimeAsync(IDLE_TIME_LIMIT_MS + DEBOUNCE_WAIT);
		expect(goAway).toHaveBeenCalledTimes(2);
	});
});
