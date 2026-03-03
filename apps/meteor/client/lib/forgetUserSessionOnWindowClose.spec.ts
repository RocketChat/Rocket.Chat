import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import { forgetUserSessionOnWindowClose } from './forgetUserSessionOnWindowClose';

describe('forgetUserSessionOnWindowClose', () => {
	beforeEach(() => {
		window.localStorage.clear();
		window.sessionStorage.clear();
		Meteor._localStorage = window.localStorage;
		Accounts.config = jest.fn();
		jest.clearAllMocks();
	});

	it('should migrate all localStorage keys to sessionStorage and clear localStorage', () => {
		window.localStorage.setItem('token', 'abc123');
		window.localStorage.setItem('userId', 'u1');

		forgetUserSessionOnWindowClose();

		expect(window.sessionStorage.getItem('token')).toBe('abc123');
		expect(window.sessionStorage.getItem('userId')).toBe('u1');
		expect(window.localStorage.length).toBe(0);
	});

	it('should set Meteor local storage to sessionStorage and configure accounts client storage', () => {
		window.localStorage.setItem('token', 'abc123');

		forgetUserSessionOnWindowClose();

		expect(Meteor._localStorage).toBe(window.sessionStorage);
		expect(Accounts.config).toHaveBeenCalledWith({ clientStorage: 'session' });
	});
});
