// Do not disclose if user exists when password is invalid
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

const { _runLoginHandlers } = Accounts;
Accounts._runLoginHandlers = function (methodInvocation, options) {
	const result = _runLoginHandlers.call(Accounts, methodInvocation, options);

	if (result.error && result.error.reason === 'Incorrect password') {
		result.error = new Meteor.Error(403, 'User not found');
	}

	return result;
};
