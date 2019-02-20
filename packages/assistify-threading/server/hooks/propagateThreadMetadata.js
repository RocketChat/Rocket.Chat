
import { callbacks } from 'meteor/rocketchat:callbacks';
import { Messages } from 'meteor/rocketchat:models';
/**
 * We need to propagate the writing of new message in a thread to the linking
 * system message
 */
callbacks.add('afterSaveMessage', function(message, room) {
	if (room.linkMessageId) {
		Messages.refreshThreadMetadata(room.linkMessageId);
	}
	return message;
}, callbacks.priority.LOW, 'PropagateThreadMetadata');
