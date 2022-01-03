import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';

import { baseUrl } from './settings';

Meteor.methods({
	chatpalUtilsCreateKey(email) {
		try {
			const response = HTTP.call('POST', `${baseUrl}account`, { data: { email, tier: 'free' } });
			if (response.statusCode === 201) {
				return response.data.key;
			}
			return false;
		} catch (e) {
			return false;
		}
	},
	chatpalUtilsGetTaC(lang) {
		try {
			const response = HTTP.call('GET', `${baseUrl}terms/${lang}.html`);
			if (response.statusCode === 200) {
				return response.content;
			}
			return undefined;
		} catch (e) {
			return false;
		}
	},
});
