import { Users } from '@rocket.chat/models';
import { Accounts } from 'meteor/accounts-base';
import { check } from 'meteor/check';

Accounts.registerLoginHandler('login-token', async (result) => {
	if (!result.loginToken) {
		return;
	}

	check(result.loginToken, String);

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
