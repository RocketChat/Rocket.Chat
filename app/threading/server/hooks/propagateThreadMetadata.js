
import { callbacks } from '../../../callbacks';
import { Messages, Rooms } from '../../../models';
import { deleteRoom } from '../../../lib';
/**
 * We need to propagate the writing of new message in a thread to the linking
 * system message
 */
callbacks.add('afterSaveMessage', function(message, { _id, prid } = {}) {
	if (prid) {
		Messages.refreshThreadMetadata({ rid: _id }, message);
	}
	return message;
}, callbacks.priority.LOW, 'PropagateThreadMetadata');

callbacks.add('afterDeleteMessage', function(message, { _id, prid } = {}) {
	if (prid) {
		Messages.refreshThreadMetadata({ rid: _id }, message);
	}
	if (message.trid) {
		deleteRoom(message.trid);
	}
	return message;
}, callbacks.priority.LOW, 'PropagateThreadMetadata');

callbacks.add('afterDeleteRoom', function(rid) {
	Rooms.find({ prid: rid }, { fields: { _id: 1 } }).forEach(({ _id }) => deleteRoom(_id));
}, 'DeleteThreadChain');
