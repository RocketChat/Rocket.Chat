import { HTTP } from 'meteor/http';
import { Meteor } from 'meteor/meteor';

function isJSON(obj) {
	try {
		JSON.parse(obj);
		return true;
	} catch (e) {
		return false;
	}
}

export const schema = `
	type Query {
		oauthProviders: [OauthProvider]
	}
`;

export const resolver = {
	Query: {
		oauthProviders: async() => {
			// depends on rocketchat:grant package
			try {
				const url = Meteor.absoluteUrl('_oauth_apps/providers');
				console.log('url', url);
				const result = HTTP.get(Meteor.absoluteUrl('_oauth_apps/providers')).content;

				if (isJSON(result)) {
					const providers = JSON.parse(result).data;

					return providers.map((name) => ({ name }));
				} else {
					throw new Error('Could not parse the result');
				}
			} catch (e) {
				console.error('oauthProviders resolver', e);
				throw new Error('rocketchat:grant not installed');
			}
		}
	}
};
