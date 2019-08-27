import { Meteor } from 'meteor/meteor';
import { Rooms } from 'meteor/rocketchat:models';
import { settings } from 'meteor/rocketchat:settings';
import { callbacks } from 'meteor/rocketchat:callbacks';
import './settings.js';
import googleLanguage from '@google-cloud/language';

let languageClient;

settings.get('GoogleNaturalLanguage_ServiceAccount', (key, value) => {
	if (value) {
		try {
			languageClient = googleLanguage({
				credentials: JSON.parse(value),
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
			Rooms.setSentiment(message.rid, result);
		}
	}));

	return message;
};

settings.get('GoogleNaturalLanguage_Enabled', (key, value) => {
	if (value) {
		callbacks.add('afterSaveMessage', setRoomSentiment, callbacks.priority.MEDIUM, 'GoogleNaturalLanguage');
	} else {
		callbacks.remove('afterSaveMessage', 'GoogleNaturalLanguage');
	}
});
