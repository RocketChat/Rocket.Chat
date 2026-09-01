import { Accounts } from 'meteor/accounts-base';

import { createMeteorBackedSdk } from './meteorBackedSdk';

describe('createMeteorBackedSdk account lifecycle hooks', () => {
	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('reports an asynchronously rejected lifecycle hook', async () => {
		let lifecycleHook: (() => void) | undefined;
		jest.mocked(Accounts.onLogin).mockImplementation((handler) => {
			lifecycleHook = handler as () => void;
			return { stop: jest.fn() };
		});

		const error = new Error('lifecycle hook failed');
		const rejection = Promise.reject(error);
		void rejection.catch(() => undefined);
		const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

		createMeteorBackedSdk().account.onLogin(() => rejection);
		lifecycleHook?.();
		await Promise.resolve();

		expect(consoleError).toHaveBeenCalledWith(error);
	});
});
