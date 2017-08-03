// Do not disclose if user exists when password is invalid
const _runLoginHandlers = Accounts._runLoginHandlers;
Accounts._runLoginHandlers = function(methodInvocation, options) {
	const result = _runLoginHandlers.call(Accounts, methodInvocation, options);

	if (result.error && result.error.reason === 'Incorrect password') {
		result.error = new Meteor.Error(403, 'User not found');
	}

	return result;
};
