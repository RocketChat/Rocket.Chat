import { Meteor } from 'meteor/meteor';
import { useCallback } from 'react';

export const useMethod = (methodName) => useCallback((...args) => new Promise((resolve, reject) => {
	Meteor.call(methodName, ...args, (error, result) => {
		if (error) {
			reject(error);
			return;
		}

		resolve(result);
	});
}), [methodName]);
