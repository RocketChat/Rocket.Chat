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

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'OAuth.retrieveCredential'(credentialToken: string, credentialSecret: string): unknown;
	}
}
