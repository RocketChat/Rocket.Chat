import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';

import { settings } from '../../../settings';

let userAgent = 'Meteor';
if (Meteor.release) {
	userAgent += `/${Meteor.release}`;
}

export const getProtectedTokenpassBalances = function (accessToken) {
	try {
		return HTTP.get(`${settings.get('API_Tokenpass_URL')}/api/v1/tca/protected/balances`, {
			headers: {
				'Accept': 'application/json',
				'User-Agent': userAgent,
			},
			params: {
				oauth_token: accessToken,
			},
		}).data;
	} catch (error) {
		throw new Error(`Failed to fetch protected tokenpass balances from Tokenpass. ${error.message}`);
	}
};
