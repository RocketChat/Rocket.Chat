import { RocketChat } from 'meteor/rocketchat:lib';

/**
 * We need to propagate the writing of new message in a thread to the linking
 * system message
 */
RocketChat.callbacks.add('afterSaveMessage', function(message, room) {
	if (room.linkMessageId) {
		RocketChat.models.Messages.refreshThreadMetadata(room.linkMessageId);
	}
	return message;
}, RocketChat.callbacks.priority.LOW, 'PropagateThreadMetadata');
