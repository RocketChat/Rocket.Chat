import { ClientSafeError } from '@rocket.chat/core-services';
import { Users } from '@rocket.chat/models';
import { Accounts } from 'meteor/accounts-base';

Accounts.registerLoginHandler('login-token', async (result) => {
	if (!result.loginToken) {
		return;
	}

	if (typeof result.loginToken !== 'string') {
		throw new ClientSafeError('error-invalid-arguments', 'Invalid arguments');
	}

	const user = await Users.findOne({
		'services.loginToken.token': result.loginToken,
	});

	if (user) {
		await Users.updateOne({ _id: user._id }, { $unset: { 'services.loginToken': 1 } });

		return {
			userId: user._id,
		};
	}
});
