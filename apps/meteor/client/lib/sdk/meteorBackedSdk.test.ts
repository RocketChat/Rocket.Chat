import { afterEach, describe, it } from 'node:test';

import { expect } from 'expect';
import { ModuleMocker, mocked } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';
import { Accounts } from 'meteor/accounts-base';

import { createMeteorBackedSdk } from './meteorBackedSdk';

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);
const spyOn: ModuleMocker['spyOn'] = mocker.spyOn.bind(mocker);

describe('createMeteorBackedSdk account lifecycle hooks', () => {
	afterEach(() => {
		mocker.restoreAllMocks();
	});

	it('reports an asynchronously rejected lifecycle hook', async () => {
		let lifecycleHook: (() => void) | undefined;
		mocked(Accounts.onLogin).mockImplementation((handler) => {
			lifecycleHook = handler as () => void;
			return { stop: fn<FunctionLike>() };
		});

		const error = new Error('lifecycle hook failed');
		const rejection = Promise.reject(error);
		void rejection.catch(() => undefined);
		const consoleError = spyOn(console, 'error').mockImplementation(() => undefined);

		createMeteorBackedSdk().account.onLogin(() => rejection);
		lifecycleHook?.();
		await Promise.resolve();

		expect(consoleError).toHaveBeenCalledWith(error);
	});
});
