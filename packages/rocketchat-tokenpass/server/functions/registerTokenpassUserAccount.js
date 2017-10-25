let userAgent = 'Meteor';
if (Meteor.release) { userAgent += `/${ Meteor.release }`; }

RocketChat.registerTokenpassUserAccount = function(user) {
	try {
		// See http://apidocs.tokenly.com/tokenpass/#register-a-new-account
		const result = HTTP.post(`${ RocketChat.settings.get('API_Tokenpass_URL') }/api/v1/register`, {
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
		return result && result.data && result.data.result;
	} catch (exception) {
		throw new Meteor.Error(exception.response && exception.response.data && (exception.response.data.message || exception.response.data.error)) || TAPi18n.__('Tokenpass_Command_Error_Unknown');
	}
};
