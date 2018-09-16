let userAgent = 'Meteor';
if (Meteor.release) { userAgent += `/${ Meteor.release }`; }

RocketChat.registerTokenpassAddress = function(accessToken, address) {
	if (!accessToken) {
		throw new Meteor.Error(TAPi18n.__('Tokenpass_Command_Error_NotLoggedIn'));
	}
	try {
		// See http://apidocs.tokenly.com/tokenpass/#register-address
		const result = HTTP.post(`${ RocketChat.settings.get('API_Tokenpass_URL') }/api/v1/tca/address`, {
			headers: {
				Accept: 'application/json',
				'User-Agent': userAgent
			},
			params: {
				oauth_token: accessToken
			},
			data: {
				address
			}
		});
		return result && result.data && result.data.result;
	} catch (exception) {
		throw new Meteor.Error(exception.response && exception.response.data && (exception.response.data.message || exception.response.data.error) || TAPi18n.__('Tokenpass_Command_Error_Unknown'));
	}
};
