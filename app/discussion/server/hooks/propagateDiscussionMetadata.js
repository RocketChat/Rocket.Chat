
import { callbacks } from '../../../callbacks';
import { Messages, Rooms } from '../../../models';
import { deleteRoom } from '../../../lib';
/**
 * We need to propagate the writing of new message in a discussion to the linking
 * system message
 */
callbacks.add('afterSaveMessage', function(message, { _id, prid } = {}) {
	if (prid) {
		Messages.refreshDiscussionMetadata({ rid: _id }, message);
	}
	return message;
}, callbacks.priority.LOW, 'PropagateDiscussionMetadata');

callbacks.add('afterDeleteMessage', function(message, { _id, prid } = {}) {
	if (prid) {
		Messages.refreshDiscussionMetadata({ rid: _id }, message);
	}
	if (message.trid) {
		deleteRoom(message.trid);
	}
	return message;
}, callbacks.priority.LOW, 'PropagateDiscussionMetadata');

callbacks.add('afterDeleteRoom', function(rid) {
	Rooms.find({ prid: rid }, { fields: { _id: 1 } }).forEach(({ _id }) => deleteRoom(_id));
}, 'DeleteDiscussionChain');
