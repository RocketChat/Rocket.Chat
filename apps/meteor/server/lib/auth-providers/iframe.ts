import { ClientSafeError } from '@rocket.chat/core-services';
import { Users } from '@rocket.chat/models';
import { Accounts } from 'meteor/accounts-base';

Accounts.registerLoginHandler('iframe', async (result) => {
	if (!result.iframe) {
		return;
	}

	if (typeof result.token !== 'string') {
		throw new ClientSafeError('error-invalid-arguments', 'Invalid arguments');
	}

	const user = await Users.findOne({
		'services.iframe.token': result.token,
	});

	if (user) {
		return {
			userId: user._id,
		};
	}
});
