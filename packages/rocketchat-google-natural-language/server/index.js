import './settings.js';
import './models/Rooms.js';

const getMessageSentiment = function(message) {
	const Language = Npm.require('@google-cloud/language');

	const languageClient = Language({
		credentials: JSON.parse(RocketChat.settings.get('GoogleNaturalLanguage_ServiceAccount'))
	});

	const result = Meteor.wrapAsync(languageClient.detectSentiment, languageClient)(message.msg);

	if (result) {
		// message.sentiment = result;
		RocketChat.models.Rooms.setSentiment(message.rid, result);
	}

	return message;
};

RocketChat.callbacks.add('afterSaveMessage', getMessageSentiment, RocketChat.callbacks.priority.MEDIUM, 'GoogleNaturalLanguage');
