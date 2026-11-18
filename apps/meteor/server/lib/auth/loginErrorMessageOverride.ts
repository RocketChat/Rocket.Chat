// Do not disclose if user exists when password is invalid
import { isClientSafeError, ClientSafeError } from '@rocket.chat/core-services';
import { Accounts } from 'meteor/accounts-base';

const { _runLoginHandlers } = Accounts;

Accounts._options.ambiguousErrorMessages = true;
Accounts._runLoginHandlers = async function (methodInvocation, options) {
	const result = await _runLoginHandlers.call(Accounts, methodInvocation, options);

	if (isClientSafeError(result.error)) {
		result.error = new ClientSafeError(401, 'User not found');
	}

	return result;
};
