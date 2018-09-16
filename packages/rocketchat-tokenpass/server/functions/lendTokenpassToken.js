import moment from 'moment';

let userAgent = 'Meteor';
if (Meteor.release) { userAgent += `/${ Meteor.release }`; }

RocketChat.lendTokenpassToken = function(lending) {
	const authApiToken = RocketChat.settings.get('Accounts_OAuth_Tokenpass_id');
	const authApiSecret = RocketChat.settings.get('Accounts_OAuth_Tokenpass_secret');
	const authApiNonce = Date.now();

	const requestParams = {
		source: lending.address,
		destination: lending.username,
		asset: lending.token,
		quantity: lending.amount * 100000000,
		expiration: lending.days > 0 ? moment().add(lending.days, 'days').toDate() : null
	};

	const endPointUrl = `${ RocketChat.settings.get('API_Tokenpass_URL') }/api/v1/tca/provisional/tx`;
	const authApiMessage = `POST\n${ endPointUrl }\n${ JSON.stringify(requestParams) }\n${ authApiToken }\n${ authApiNonce }`;

	const crypto = require('crypto');
	const hmac = crypto.createHmac('sha256', authApiSecret).update(authApiMessage).digest();
	const authApiSignature = hmac.toString('base64');

	try {
		// See https://apidocs.tokenly.com/tokenpass/#submit-provisional-tx
		const result = HTTP.post(endPointUrl, {
			headers: {
				Accept: 'application/json',
				'User-Agent': userAgent,
				'X-Tokenly-Auth-Api-Token': authApiToken,
				'X-Tokenly-Auth-Nonce': authApiNonce,
				'x-Tokenly-Auth-Signature': authApiSignature
			},
			params: requestParams
		});

		return result && result.data && result.data.result;
	} catch (exception) {
		throw new Meteor.Error(exception.response && exception.response.data && (exception.response.data.message || exception.response.data.error) || TAPi18n.__('Tokenpass_Command_Error_Unknown'));
	}
};
