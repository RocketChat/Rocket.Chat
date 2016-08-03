/* globals HTTP, SystemLogger */

var knowledgeEnabled = false;
var apiaiKey = '';
var apiaiLanguage = 'en';
RocketChat.settings.get('Livechat_Knowledge_Enabled', function(key, value) {
	knowledgeEnabled = value;
});
RocketChat.settings.get('Livechat_Knowledge_Apiai_Key', function(key, value) {
	apiaiKey = value;
});
RocketChat.settings.get('Livechat_Knowledge_Apiai_Language', function(key, value) {
	apiaiLanguage = value;
});

RocketChat.callbacks.add('afterSaveMessage', function(message, room) {
	// skips this callback if the message was edited
	if (message.editedAt) {
		return message;
	}

	if (!knowledgeEnabled) {
		return message;
	}

	if (!(typeof room.t !== 'undefined' && room.t === 'l' && room.v && room.v.token)) {
		return message;
	}

	// if the message hasn't a token, it was not sent by the visitor, so ignore it
	if (!message.token) {
		return message;
	}

	Meteor.defer(() => {
		try {
			const response = HTTP.post('https://api.api.ai/api/query?v=20150910', {
				data: {
					query: message.msg,
					lang: apiaiLanguage
				},
				headers: {
					'Content-Type': 'application/json; charset=utf-8',
					'Authorization': 'Bearer ' + apiaiKey
				}
			});

			if (response.data && response.data.status.code === 200 && !_.isEmpty(response.data.result.fulfillment.speech)) {
				RocketChat.models.LivechatExternalMessage.insert({
					rid: message.rid,
					msg: response.data.result.fulfillment.speech,
					orig: message._id,
					ts: new Date()
				});
			}
		} catch (e) {
			SystemLogger.error('Error using Api.ai ->', e);
		}
	});

	return message;
}, RocketChat.callbacks.priority.LOW, 'externalWebHook');
