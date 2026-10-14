import { after, afterEach, before, beforeEach, describe, it, mock } from 'node:test';

import { expect } from 'expect';
import { ModuleMocker, mocked } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';

import { enterModuleScope, leaveModuleScope } from '../../tests/mocks/moduleScope';

let onLoggedIn: (typeof import('./loggedIn'))['onLoggedIn'];
let getDdpSdk: (typeof import('./sdk/ddpSdk'))['getDdpSdk'];
let getUserId: (typeof import('./user'))['getUserId'];

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);
const spyOn: ModuleMocker['spyOn'] = mocker.spyOn.bind(mocker);

describe('onLoggedIn', () => {
	before(() => {
		enterModuleScope();
		mock.module('./sdk/ddpSdk', {
			exports: {
				getDdpSdk: fn<FunctionLike>(),
			},
		});
		mock.module('./user', {
			exports: {
				getUserId: fn<FunctionLike>(),
			},
		});
		({ onLoggedIn } = require('./loggedIn'));
		({ getDdpSdk } = require('./sdk/ddpSdk'));
		({ getUserId } = require('./user'));
	});

	after(leaveModuleScope);
	let loginHandler: (() => void) | undefined;
	let stop = fn<FunctionLike>();

	beforeEach(() => {
		loginHandler = undefined;
		stop = fn<FunctionLike>();
		mocked(getUserId).mockReturnValue(undefined);
		mocked(getDdpSdk).mockReturnValue({
			account: {
				onLogin: (handler: () => void) => {
					loginHandler = handler;
					return stop;
				},
			},
		} as unknown as ReturnType<typeof getDdpSdk>);
	});

	afterEach(() => {
		mocker.restoreAllMocks();
	});

	it('reports a rejected callback without blocking the login hook', async () => {
		const error = new Error('login callback failed');
		const consoleError = spyOn(console, 'error').mockImplementation(() => undefined);
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
		const cleanup = fn<FunctionLike>();
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
		const staleCleanup = fn<FunctionLike>();
		const currentCleanup = fn<FunctionLike>();
		const callback = fn<FunctionLike>().mockReturnValueOnce(firstCleanupPromise).mockReturnValueOnce(secondCleanupPromise);
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
		const cleanup = fn<FunctionLike>(() => {
			throw error;
		});
		const callback = fn<FunctionLike>().mockReturnValueOnce(cleanup).mockReturnValueOnce(undefined);
		const consoleError = spyOn(console, 'error').mockImplementation(() => undefined);
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
