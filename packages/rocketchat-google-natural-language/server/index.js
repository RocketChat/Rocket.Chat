import './settings.js';
import './models/Rooms.js';
import googleLanguage from '@google-cloud/language';

let languageClient;

RocketChat.settings.get('GoogleNaturalLanguage_ServiceAccount', (key, value) => {
	if (value) {
		try {
			languageClient = googleLanguage({
				credentials: JSON.parse(value)
			});
		} catch (e) {
			languageClient = null;
			console.error('Error parsing Google Natural Language credential.', e);
		}
	}
});

const setRoomSentiment = function(message) {
	if (!languageClient) {
		return;
	}

	languageClient.detectSentiment(message.msg, Meteor.bindEnvironment((error, result) => {
		if (!error) {
			RocketChat.models.Rooms.setSentiment(message.rid, result);
		}
	}));

	return message;
};

RocketChat.settings.get('GoogleNaturalLanguage_Enabled', (key, value) => {
	if (value) {
		RocketChat.callbacks.add('afterSaveMessage', setRoomSentiment, RocketChat.callbacks.priority.MEDIUM, 'GoogleNaturalLanguage');
	} else {
		RocketChat.callbacks.remove('afterSaveMessage', 'GoogleNaturalLanguage');
	}
});
