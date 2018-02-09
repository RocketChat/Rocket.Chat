/* globals RocketChat, SystemLogger */

import {getKnowledgeAdapter} from '../lib/KnowledgeAdapterProvider';

RocketChat.callbacks.remove('afterSaveMessage', 'externalWebHook');

RocketChat.callbacks.add('afterSaveMessage', function(message, room) {
	// skips this callback if the message was edited
	if (message.editedAt) {
		return message;
	}

	let knowledgeEnabled = false;
	RocketChat.settings.get('Assistify_AI_Enabled', function(key, value) {
		knowledgeEnabled = value;
	});

	if (!knowledgeEnabled) {
		return message;
	}

	if (!(typeof room.t !== 'undefined' && room.v)) {
		return message;
	}

	const knowledgeAdapter = getKnowledgeAdapter();
	if (!knowledgeAdapter) {
		return;
	}

	Meteor.defer(() => {
		try {
			knowledgeAdapter.onMessage(message);
		} catch (e) {
			SystemLogger.error('Error using knowledge provider ->', e);
		}
	});

	return message;
}, RocketChat.callbacks.priority.LOW, 'Assistify_AI_OnMessage');
