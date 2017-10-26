let userAgent = 'Meteor';
if (Meteor.release) { userAgent += `/${ Meteor.release }`; }

RocketChat.verifyTokenpassAddress = function(accessToken, address, signature) {
	if (!accessToken) {
		throw new Meteor.Error(TAPi18n.__('Tokenpass_Command_Error_NotLoggedIn'));
	}

	try {
		// See http://apidocs.tokenly.com/tokenpass/#verify-address
		const result = HTTP.post(`${ RocketChat.settings.get('API_Tokenpass_URL') }/api/v1/tca/address/${ address }`, {
			headers: {
				Accept: 'application/json',
				'User-Agent': userAgent
			},
			params: {
				oauth_token: accessToken
			},
			data: {
				signature
			}
		});
		return result && result.data && result.data.result;
	} catch (exception) {
		throw new Meteor.Error(exception.response && exception.response.data && (exception.response.data.message || exception.response.data.error) || TAPi18n.__('Tokenpass_Command_Error_Unknown'));
	}
};
