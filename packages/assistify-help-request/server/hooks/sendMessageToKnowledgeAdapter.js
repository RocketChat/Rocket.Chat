/* globals SystemLogger */

import {getKnowledgeAdapter} from 'meteor/assistify:ai';

Meteor.startup(() => {
	RocketChat.callbacks.add('afterSaveMessage', function(message, room) {

		let knowledgeEnabled = false;
		RocketChat.settings.get('Assistify_AI_Enabled', function(key, value) { //todo: Own stting
			knowledgeEnabled = value;
		});

		if (!knowledgeEnabled) {
			return message;
		}

		// we want to propagate messages from requests and expertises
		if (!(room.t && (room.t === 'r' || room.t === 'e'))) {
			return message;
		}

		const knowledgeAdapter = getKnowledgeAdapter();
		if (!knowledgeAdapter) {
			return;
		}

		//do not trigger a new evaluation if the message was sent from a bot (particularly by assistify itself)
		//todo: Remove dependency to bot. It should actually be the other way round.
		//proposal: Make bot create metadata in the help-request collection
		const botUsername = RocketChat.settings.get('Assistify_Bot_Username');
		if (message.u.username === botUsername) {
			return;
		}

		Meteor.defer(() => {

			const helpRequest = RocketChat.models.HelpRequests.findOneById(room.helpRequestId);
			const context = {};
			if (helpRequest) { //there might be rooms without help request objects if they have been created inside the chat-application
				context.contextType = 'ApplicationHelp';
				context.environmentType = helpRequest.supportArea;
				context.environment = helpRequest.environment;
			}
			try {
				knowledgeAdapter.onMessage(message, context, room.expertise ? [room.expertise] : []);
			} catch (e) {
				SystemLogger.error('Error using knowledge provider ->', e);
			}
		});

		return message;
	}, RocketChat.callbacks.priority.LOW);
});
