let userAgent = 'Meteor';
if (Meteor.release) { userAgent += `/${ Meteor.release }`; }

RocketChat.registerTokenpassUserAccount = function(user, cb) {
	try {
		const result = HTTP.post(
			`${ RocketChat.settings.get('API_Tokenpass_URL') }/api/v1/account/register`, {
				headers: {
					Accept: 'application/json',
					'User-Agent': userAgent
				},
				params: {
					client_id: RocketChat.settings.get('Accounts_OAuth_Tokenpass_id')
				},
				data: {
					username: user.username,
					password: Random.id(),
					email: user.emails[0] && user.emails[0].address
				}
			});
		console.log(result);

		return cb(null, result && result.data && result.data.result);
	} catch (exception) {

		console.log(exception);

		return cb(
			(exception.response && exception.response.data && (exception.response.data.message || exception.response.data.error)) || TAPi18n.__('Tokenpass_Command_Error_Unknown')
		);
	}
};
