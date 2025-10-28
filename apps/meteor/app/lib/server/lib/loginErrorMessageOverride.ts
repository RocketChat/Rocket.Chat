// Do not disclose if user exists when password is invalid
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

const { _runLoginHandlers } = Accounts;

Accounts._options.ambiguousErrorMessages = true;
Accounts._runLoginHandlers = async function (methodInvocation, options) {
	const result = await _runLoginHandlers.call(Accounts, methodInvocation, options);

	if (result.error instanceof Meteor.Error) {
		result.error = new Meteor.Error(401, 'User not found');
	}

	return result;
};
