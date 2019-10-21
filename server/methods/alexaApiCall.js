import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';
import { check } from 'meteor/check';

import { settings } from '../../app/settings';

Meteor.methods({
	registerAlexaUser(serverUrl, serverName) {
		check(serverUrl, String);
		check(serverName, String);

		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'registerAlexaUser',
			});
		}

		const tokenName = `alexa-${ serverName }`;
		const token = Meteor.call('personalAccessTokens:generateToken', { tokenName });

		const apiUrl = settings.get('Register_Alexa_Enable_Server_Proxy_URL');
		const body = { serverurl: serverUrl, servername: serverName, userid: userId, token };
		try {
			const result = HTTP.call('POST', apiUrl, {
				headers: {
					'Content-Type': 'application/json',
				},
				data: body,
			});
			return JSON.parse(result.content);
		} catch (e) {
			console.log('Catch Error', e);
			return false;
		}
	},
});
