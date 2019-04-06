import { callbacks } from '../../../callbacks/server';
import { Messages, Rooms } from '../../../models/server';
import { deleteRoom } from '../../../lib/server';

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
	if (message.drid) {
		deleteRoom(message.drid);
	}
	return message;
}, callbacks.priority.LOW, 'PropagateDiscussionMetadata');

callbacks.add('afterDeleteRoom', function(rid) {
	Rooms.find({ prid: rid }, { fields: { _id: 1 } }).forEach(({ _id }) => deleteRoom(_id));
}, 'DeleteDiscussionChain');


callbacks.add('afterDeleteRoom', function(drid) {
	Messages.update({ drid }, {
		$unset: {
			dcount: 1,
			dlm: 1,
			drid: 1,
		},
	});
}, 'CleanDiscussionMessage');
