import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';

Meteor.methods({
	registerAlexaUser(serverurl, servername, userid, token) {
		this.unblock();
		const apiUrl = 'https://rc-fb-04.herokuapp.com/register';
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
