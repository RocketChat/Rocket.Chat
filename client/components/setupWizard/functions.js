import { Meteor } from 'meteor/meteor';

import { settings } from '../../../app/settings/lib/settings';

const withPromisifiedReturn = (f) => (...args) => new Promise((resolve, reject) => {
	f(...args, (error, ...returnedValues) => {
		if (error) {
			reject(error);
			return;
		}

		resolve(returnedValues);
	});
});

export const loginWithPassword = withPromisifiedReturn(Meteor.loginWithPassword.bind(Meteor));

export const batchSetSettings = withPromisifiedReturn(settings.batchSet.bind(settings));

export const setSetting = withPromisifiedReturn(settings.set.bind(settings));
