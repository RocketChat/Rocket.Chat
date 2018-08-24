import { HTTP } from 'meteor/http';
import { Meteor } from 'meteor/meteor';

import schema from '../../schemas/accounts/oauthProviders.graphqls';

function isJSON(obj) {
	try {
		JSON.parse(obj);
		return true;
	} catch (e) {
		return false;
	}
}

const resolver = {
	Query: {
		oauthProviders: async() => {
			// depends on rocketchat:grant package
			try {
				const result = HTTP.get(Meteor.absoluteUrl('_oauth_apps/providers')).content;

				if (isJSON(result)) {
					const providers = JSON.parse(result).data;

					return providers.map((name) => ({ name }));
				} else {
					throw new Error('Could not parse the result');
				}
			} catch (e) {
				throw new Error('rocketchat:grant not installed');
			}
		}
	}
};

export {
	schema,
	resolver
};
