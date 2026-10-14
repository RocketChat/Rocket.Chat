import { after, before, beforeEach, describe, it, mock } from 'node:test';

import { expect } from 'expect';
import { fn, mocked } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';

import { enterModuleScope, leaveModuleScope } from '../../tests/mocks/moduleScope';

let clearStoredCredentials: (typeof import('./sdk/ddpSdk'))['clearStoredCredentials'];
let STORAGE_KEYS: (typeof import('./sdk/storage'))['STORAGE_KEYS'];
let synchronizeUserData: (typeof import('./userData'))['synchronizeUserData'];

type StreamHandler = (data: { type: string; id: string }) => void;

let mockStreamHandler: StreamHandler | undefined;

describe('synchronizeUserData', () => {
	before(() => {
		enterModuleScope();
		mock.module('./SDKClient', {
			exports: {
				sdk: {
					stream: (_name: string, _args: unknown[], handler: StreamHandler) => {
						mockStreamHandler = handler;
						return { stop: fn<FunctionLike>(), ready: () => Promise.resolve() };
					},
					rest: { get: fn<FunctionLike>().mockResolvedValue({ success: true }) },
				},
			},
		});
		mock.module('./sdk/ddpSdk', {
			exports: {
				clearStoredCredentials: fn<FunctionLike>(),
			},
		});
		({ clearStoredCredentials } = require('./sdk/ddpSdk'));
		({ STORAGE_KEYS } = require('./sdk/storage'));
		({ synchronizeUserData } = require('./userData'));
	});

	after(leaveModuleScope);
	beforeEach(() => {
		mockStreamHandler = undefined;
		mocked(clearStoredCredentials).mockClear();
		localStorage.clear();
	});

	it('drops the session when the logged-in user is deleted, so nothing stale is left to log back in with', async () => {
		localStorage.setItem(STORAGE_KEYS.USER_ID, 'uid-1');

		await synchronizeUserData('uid-1');

		expect(mockStreamHandler).toBeDefined();
		mockStreamHandler?.({ type: 'removed', id: 'uid-1' });

		expect(clearStoredCredentials).toHaveBeenCalled();
	});

	it('leaves the session alone when the event belongs to a user that is no longer the one logged in', async () => {
		await synchronizeUserData('uid-1');
		// Another user logged in on this page in the meantime.
		localStorage.setItem(STORAGE_KEYS.USER_ID, 'uid-2');

		expect(mockStreamHandler).toBeDefined();
		mockStreamHandler?.({ type: 'removed', id: 'uid-1' });

		expect(clearStoredCredentials).not.toHaveBeenCalled();
	});
});
