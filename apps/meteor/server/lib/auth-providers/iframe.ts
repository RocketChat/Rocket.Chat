import { Users } from '@rocket.chat/models';
import { Accounts } from 'meteor/accounts-base';
import { check } from 'meteor/check';

Accounts.registerLoginHandler('iframe', async (result) => {
	if (!result.iframe) {
		return;
	}

	check(result.token, String);

	const user = await Users.findOne({
		'services.iframe.token': result.token,
	});

	if (user) {
		return {
			userId: user._id,
		};
	}
});
