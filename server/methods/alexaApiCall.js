import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';

import { settings } from '../../app/settings';

Meteor.methods({
	registerAlexaUser(serverurl, servername, userid, token) {
		this.unblock();
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
