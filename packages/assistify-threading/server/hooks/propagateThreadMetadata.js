
import { callbacks } from 'meteor/rocketchat:callbacks';
import { Messages, Rooms } from 'meteor/rocketchat:models';
import { deleteRoom } from 'meteor/rocketchat:lib';
/**
 * We need to propagate the writing of new message in a thread to the linking
 * system message
 */
callbacks.add('afterSaveMessage', function(message, { _id, prid, pmid } = {}) {
	if (prid && pmid) {
		Messages.refreshThreadMetadata({ rid: _id, prid, pmid }, message);
	}
	return message;
}, callbacks.priority.LOW, 'PropagateThreadMetadata');

callbacks.add('afterDeleteMessage', function(message, { _id, prid, pmid } = {}) {
	if (prid && pmid) {
		Messages.refreshThreadMetadata({ rid: _id, prid, pmid }, message);
	}
	if (message.t_rid) {
		deleteRoom(message.t_rid);
	}
	return message;
}, callbacks.priority.LOW, 'PropagateThreadMetadata');

callbacks.add('afterDeleteRoom', function(rid) {
	Rooms.find({ prid: rid }, { fields: { _id: 1 } }).forEach(({ _id }) => deleteRoom(_id));
}, 'DeleteThreadChain');
