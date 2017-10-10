import moment from 'moment';

let userAgent = 'Meteor';
if (Meteor.release) { userAgent += `/${ Meteor.release }`; }

RocketChat.lendTokenpassToken = function(lending, cb) {
	const client_id = RocketChat.settings.get('Accounts_OAuth_Tokenpass_id');
	const client_secret = RocketChat.settings.get('Accounts_OAuth_Tokenpass_secret');

	crypto = require('crypto');
	// const signature = crypto.createHmac('sha256', client_secret).update(`key=${ client_id }`).digest('hex');
	const signature = crypto.createHmac('sha256', client_secret);

	console.log('signature', signature);

	try {
		const result = HTTP.post(
			`${ RocketChat.settings.get('API_Tokenpass_URL') }/api/v1/tca/provisional/tx`, {
				headers: {
					Accept: 'application/json',
					'User-Agent': userAgent,
					'x-tokenly-auth-api-token': client_id,
					// 'x-tokenly-auth-nonce': '',
					'x-tokenly-auth-signature': signature
				},
				data: {
					source: lending.address,
					destination: lending.username,
					asset: lending.token,
					quantity: lending.amount * 100000000,
					expiration: lending.days > 0 ? moment().add(lending.days, 'days').toDate() : null
				}
			});

		console.log('result', result);

		return cb(null, result && result.data && result.data.result);
	} catch (exception) {

		console.log('exception', exception);

		return cb(
			(exception.response && exception.response.data && (exception.response.data.message || exception.response.data.error)) || TAPi18n.__('Tokenpass_Command_Error_Unknown')
		);
	}
};
