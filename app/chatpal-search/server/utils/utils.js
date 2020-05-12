import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';

Meteor.methods({
	'chatpalUtilsCreateKey'(email) {
		try {
			const response = HTTP.call('POST', 'https://beta.chatpal.io/v1/account', { data: { email, tier: 'free' } });
			if (response.statusCode === 201) {
				return response.data.key;
			}
			return false;
		} catch (e) {
			return false;
		}
	},
	'chatpalUtilsGetTaC'(lang) {
		try {
			const response = HTTP.call('GET', `https://beta.chatpal.io/v1/terms/${ lang }.html`);
			if (response.statusCode === 200) {
				return response.content;
			}
			return undefined;
		} catch (e) {
			return false;
		}
	},
});
