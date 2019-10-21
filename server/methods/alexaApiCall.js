import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';
import { check } from 'meteor/check';

import { settings } from '../../app/settings';

Meteor.methods({
	registerAlexaUser(serverurl, servername, token) {
		check(serverurl, String);
		check(servername, String);
		check(token, String);

		const userid = Meteor.userId();

		if (!userid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'registerAlexaUser',
			});
		}

		const apiUrl = settings.get('Register_Alexa_Enable_Server_Proxy_URL');
		const body = { serverurl, servername, userid, token };
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
