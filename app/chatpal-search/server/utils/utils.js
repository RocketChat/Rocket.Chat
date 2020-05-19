import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';

import ChatpalLogger from './logger';
import { settings } from '../../../settings';

Meteor.methods({
	'chatpalUtilsCreateKey'(email) {
		try {
			const data = {
				email,
				instanceId: settings.get('uniqueID'),
				baseUrl: settings.get('Site_Url'),
			};

			ChatpalLogger.debug('request chatpal key: ', JSON.stringify(data, null, 2));

			const response = HTTP.call('POST', 'https://beta.chatpal.io/v1/account', { data });
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
