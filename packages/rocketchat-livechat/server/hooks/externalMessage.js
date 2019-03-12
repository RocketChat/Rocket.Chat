import { Meteor } from 'meteor/meteor';
import { settings } from 'meteor/rocketchat:settings';
import { callbacks } from 'meteor/rocketchat:callbacks';
import { SystemLogger } from 'meteor/rocketchat:logger';
import { HTTP } from 'meteor/http';
import { LivechatExternalMessage } from '../../lib/LivechatExternalMessage';
import _ from 'underscore';

let knowledgeEnabled = false;
let apiaiKey = '';
let apiaiLanguage = 'en';
settings.get('Livechat_Knowledge_Enabled', function(key, value) {
	knowledgeEnabled = value;
});
settings.get('Livechat_Knowledge_Apiai_Key', function(key, value) {
	apiaiKey = value;
});
settings.get('Livechat_Knowledge_Apiai_Language', function(key, value) {
	apiaiLanguage = value;
});

callbacks.add('afterSaveMessage', function(message, room) {
	// skips this callback if the message was edited
	if (!message || message.editedAt) {
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
					lang: apiaiLanguage,
					sessionId: room._id,
				},
				headers: {
					'Content-Type': 'application/json; charset=utf-8',
					Authorization: `Bearer ${ apiaiKey }`,
				},
			});

			if (response.data && response.data.status.code === 200 && !_.isEmpty(response.data.result.fulfillment.speech)) {
				LivechatExternalMessage.insert({
					rid: message.rid,
					msg: response.data.result.fulfillment.speech,
					orig: message._id,
					ts: new Date(),
				});
			}
		} catch (e) {
			SystemLogger.error('Error using Api.ai ->', e);
		}
	});

	return message;
}, callbacks.priority.LOW, 'externalWebHook');
