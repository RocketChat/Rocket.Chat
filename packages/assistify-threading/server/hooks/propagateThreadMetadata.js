import { RocketChat } from 'meteor/rocketchat:lib';

/**
 * We need to propagate the writing of new message in a thread to the linking
 * system message
 */
RocketChat.callbacks.add('afterSaveMessage', function(message, { _id, prid, pmid }) {
	if (prid && pmid) {
		RocketChat.models.Messages.refreshThreadMetadata({ rid: _id, prid, pmid }, message);
	}
	return message;
}, RocketChat.callbacks.priority.LOW, 'PropagateThreadMetadata');

RocketChat.callbacks.add('afterDeleteMessage', function(message, { _id, prid, pmid }) {
	if (prid && pmid) {
		RocketChat.models.Messages.refreshThreadMetadata({ rid: _id, prid, pmid }, message);
	}
	return message;
}, RocketChat.callbacks.priority.LOW, 'PropagateThreadMetadata');
