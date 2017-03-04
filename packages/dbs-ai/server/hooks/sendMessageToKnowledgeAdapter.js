/* globals SystemLogger */

RocketChat.callbacks.add('afterSaveMessage', function (message, room) {
	// skips this callback if the message was edited
	if (message.editedAt) {
		return message;
	}

	let knowledgeEnabled = false;
	RocketChat.settings.get('Livechat_Knowledge_Enabled', function (key, value) {
		knowledgeEnabled = value;
	});

	if (!knowledgeEnabled) {
		return message;
	}

	if (!(typeof room.t !== 'undefined' && room.v && room.v.token)) {
		return message;
	}

	// if the message hasn't a token, it was not sent by the visitor, so ignore it
	if (!message.token) {
		return message;
	}

	const knowledgeAdapter = _dbs.getKnowledgeAdapter();
	if (!knowledgeAdapter) {
		return;
	}

	Meteor.defer(() => {
		try {
			knowledgeAdapter.onMessage(message);
		}
		catch (e) {
			SystemLogger.error('Error using knowledge provider ->', e);
		}
	});

	return message;
}, RocketChat.callbacks.priority.LOW);
