import { Rooms } from 'meteor/rocketchat:models';
import { Meteor } from 'meteor/meteor';
import googleLanguage from '@google-cloud/language';
import { callbacks } from 'meteor/rocketchat:callbacks';

import { settings } from '../../../app/settings/server';

let languageClient;

settings.watch('GoogleNaturalLanguage_ServiceAccount', (value) => {
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

const setRoomSentiment = function (message) {
	if (!languageClient) {
		return message;
	}

	languageClient.detectSentiment(
		message.msg,
		Meteor.bindEnvironment((error, result) => {
			if (!error) {
				Rooms.setSentiment(message.rid, result);
			}
		}),
	);

	return message;
};

settings.watch('GoogleNaturalLanguage_Enabled', (value) => {
	if (value) {
		callbacks.add('afterSaveMessage', setRoomSentiment, callbacks.priority.MEDIUM, 'GoogleNaturalLanguage');
	} else {
		callbacks.remove('afterSaveMessage', 'GoogleNaturalLanguage');
	}
});
