import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

export const forgetUserSessionOnWindowClose = (): void => {
	if (!window.localStorage) {
		return;
	}

	Object.keys(window.localStorage).forEach((key) => {
		const value = window.localStorage.getItem(key);
		if (value === null) {
			return;
		}

		window.sessionStorage.setItem(key, value);
	});

	window.localStorage.clear();
	Meteor._localStorage = window.sessionStorage;
	Accounts.config({ clientStorage: 'session' });
};
