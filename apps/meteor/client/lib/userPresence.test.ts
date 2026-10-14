import { afterEach, beforeEach, describe, it } from 'node:test';

import type { IUser } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';
import { renderHook } from '@testing-library/react';
import { expect } from 'expect';
import { fn } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

let clock: sinon.SinonFakeTimers;

const IDLE_TIME_LIMIT = 300;
const IDLE_TIME_LIMIT_MS = IDLE_TIME_LIMIT * 1000;
const DEBOUNCE_WAIT = 1000;

const state = {
	connected: true,
	isLoggingIn: false,
	user: { _id: 'john.doe', status: UserStatus.ONLINE, statusDefault: UserStatus.ONLINE } as unknown as IUser | undefined,
	preferences: { enableAutoAway: true, idleTimeLimit: IDLE_TIME_LIMIT } as Record<string, unknown>,
};

const goOnline = fn<FunctionLike>(async (): Promise<boolean | undefined> => true);
const goAway = fn<FunctionLike>(async (): Promise<boolean | undefined> => true);
const storeUser = fn<FunctionLike>();

const { UserPresence } = proxyquire.noCallThru().load<typeof import('./userPresence')>('./userPresence', {
	'@rocket.chat/ui-contexts': {
		useUser: () => state.user,
		useConnectionStatus: () => ({ connected: state.connected }),
		useIsLoggingIn: () => state.isLoggingIn,
		useUserPreference: (key: string) => state.preferences[key],
		useMethod: (method: string) => (method === 'UserPresence:online' ? goOnline : goAway),
	},
	'../stores': {
		Users: { use: (selector: (state: { store: unknown }) => unknown) => selector({ store: storeUser }) },
	},
});

describe('UserPresence', () => {
	let userPresence: InstanceType<typeof UserPresence>;

	beforeEach(() => {
		clock = sinon.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
		clock.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

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
		clock?.restore();
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
		await clock.tickAsync(IDLE_TIME_LIMIT_MS + DEBOUNCE_WAIT);
	};

	it('should set the user away once the idle time limit is reached', async () => {
		render();

		await clock.tickAsync(IDLE_TIME_LIMIT_MS - 1000);
		expect(goAway).not.toHaveBeenCalled();

		await clock.tickAsync(1000 + DEBOUNCE_WAIT);
		expect(goAway).toHaveBeenCalledTimes(1);
	});

	it('should keep an idle user away after a reconnection', async () => {
		const { rerender } = render();

		await goIdle();
		expect(goAway).toHaveBeenCalledTimes(1);

		dropConnection(rerender);
		await clock.tickAsync(30_000);

		restoreConnection(rerender);
		await clock.tickAsync(0);

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
		await clock.tickAsync(0);
		expect(goAway).toHaveBeenCalledTimes(1);

		state.isLoggingIn = false;
		rerender();
		await clock.tickAsync(0);
		expect(goAway).toHaveBeenCalledTimes(2);
	});

	it('should bring the user back online on reconnection if they interacted while disconnected', async () => {
		const { rerender } = render();

		await goIdle();
		expect(goAway).toHaveBeenCalledTimes(1);

		dropConnection(rerender);

		document.dispatchEvent(new MouseEvent('mousemove'));

		restoreConnection(rerender);
		await clock.tickAsync(DEBOUNCE_WAIT);

		expect(goAway).toHaveBeenCalledTimes(1);
		expect(goOnline).toHaveBeenCalledTimes(1);
	});

	it('should not announce the user online when the page loads', async () => {
		render();
		await clock.tickAsync(DEBOUNCE_WAIT);

		expect(goOnline).not.toHaveBeenCalled();
	});

	it('should not restart the idle countdown from scratch on a reconnection', async () => {
		const { rerender } = render();

		await clock.tickAsync(IDLE_TIME_LIMIT_MS - 60_000);
		expect(goAway).not.toHaveBeenCalled();

		dropConnection(rerender);
		restoreConnection(rerender);
		await clock.tickAsync(0);

		// still online, but only the remaining minute of inactivity is left
		expect(goAway).not.toHaveBeenCalled();

		await clock.tickAsync(60_000 + DEBOUNCE_WAIT);
		expect(goAway).toHaveBeenCalledTimes(1);
	});

	it('should count the time spent disconnected as inactivity', async () => {
		const { rerender } = render();

		await clock.tickAsync(60_000);

		dropConnection(rerender);
		await clock.tickAsync(IDLE_TIME_LIMIT_MS);
		expect(goAway).not.toHaveBeenCalled();

		restoreConnection(rerender);
		await clock.tickAsync(0);

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
			await clock.tickAsync(DEBOUNCE_WAIT);
			expect(goAway).not.toHaveBeenCalled();

			restoreConnection(rerender);
			await clock.tickAsync(0);

			expect(goAway).toHaveBeenCalledTimes(1);
		} finally {
			delete (window as { RocketChatDesktop?: unknown }).RocketChatDesktop;
		}
	});

	it('should not force the user away on reconnection when auto away is disabled', async () => {
		state.preferences = { enableAutoAway: false, idleTimeLimit: IDLE_TIME_LIMIT };

		const { rerender } = render();

		await clock.tickAsync(IDLE_TIME_LIMIT_MS * 2);

		dropConnection(rerender);
		restoreConnection(rerender);
		await clock.tickAsync(DEBOUNCE_WAIT);

		expect(goAway).not.toHaveBeenCalled();
	});

	it('should go online when a desktop user returns while going away is still in progress', async () => {
		let setUserOnline: ((online: boolean) => void) | undefined;
		let resolveGoAway: ((value: boolean) => void) | undefined;

		Object.assign(window, {
			RocketChatDesktop: {
				setUserPresenceDetection: (options: { setUserOnline: (online: boolean) => void }) => {
					setUserOnline = options.setUserOnline;
				},
			},
		});
		goAway.mockReturnValueOnce(
			new Promise((resolve) => {
				resolveGoAway = resolve;
			}),
		);

		try {
			render();

			setUserOnline?.(false);
			await clock.tickAsync(DEBOUNCE_WAIT);
			expect(goAway).toHaveBeenCalledTimes(1);

			setUserOnline?.(true);
			await clock.tickAsync(DEBOUNCE_WAIT);
			resolveGoAway?.(true);
			await clock.tickAsync(0);

			expect(goOnline).toHaveBeenCalledTimes(1);
		} finally {
			delete (window as { RocketChatDesktop?: unknown }).RocketChatDesktop;
		}
	});

	it('should report the latest desktop transition when the user returns within the debounce window', async () => {
		let setUserOnline: ((online: boolean) => void) | undefined;

		Object.assign(window, {
			RocketChatDesktop: {
				setUserPresenceDetection: (options: { setUserOnline: (online: boolean) => void }) => {
					setUserOnline = options.setUserOnline;
				},
			},
		});

		try {
			render();

			setUserOnline?.(false);
			await clock.tickAsync(DEBOUNCE_WAIT / 2);
			setUserOnline?.(true);
			await clock.tickAsync(DEBOUNCE_WAIT);

			expect(goAway).not.toHaveBeenCalled();
			expect(goOnline).toHaveBeenCalledTimes(1);
		} finally {
			delete (window as { RocketChatDesktop?: unknown }).RocketChatDesktop;
		}
	});

	it('should go online again after interacting with the UI', async () => {
		render();

		await goIdle();
		expect(goAway).toHaveBeenCalledTimes(1);

		document.dispatchEvent(new MouseEvent('mousemove'));
		await clock.tickAsync(DEBOUNCE_WAIT);

		expect(goOnline).toHaveBeenCalledTimes(1);

		// and goes away again after a new idle period
		await clock.tickAsync(IDLE_TIME_LIMIT_MS + DEBOUNCE_WAIT);
		expect(goAway).toHaveBeenCalledTimes(2);
	});
});
