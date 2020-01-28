import { Meteor } from 'meteor/meteor';
import { useCallback } from 'react';

export const useLoginWithPassword = () => useCallback((user, password) => new Promise((resolve, reject) => {
	Meteor.loginWithPassword(user, password, (error, result) => {
		if (error) {
			reject(error);
			return;
		}

		resolve(result);
	});
}), []);
