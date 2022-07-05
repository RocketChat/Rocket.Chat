import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

Meteor.loginWithCrowd = function (...args) {
	// Pull username and password
	const username = args.shift();
	const password = args.shift();
	const callback = args.shift();

	const loginRequest = {
		crowd: true,
		username,
		crowdPassword: password,
	};
	Accounts.callLoginMethod({
		methodArguments: [loginRequest],
		userCallback(error) {
			if (callback) {
				if (error) {
					return callback(error);
				}
				return callback();
			}
		},
	});
};
