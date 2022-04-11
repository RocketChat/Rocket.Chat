import { callbacks } from '../../../../lib/callbacks';
import { Messages, Rooms } from '../../../models/server';
import { deleteRoom } from '../../../lib/server';

/**
 * We need to propagate the writing of new message in a discussion to the linking
 * system message
 */
callbacks.add(
	'afterSaveMessage',
	function (message, { _id, prid } = {}) {
		if (prid) {
			Messages.refreshDiscussionMetadata({ rid: _id }, message);
		}
		return message;
	},
	callbacks.priority.LOW,
	'PropagateDiscussionMetadata',
);

callbacks.add(
	'afterDeleteMessage',
	function (message, { _id, prid } = {}) {
		if (prid) {
			Messages.refreshDiscussionMetadata({ rid: _id }, message);
		}
		if (message.drid) {
			deleteRoom(message.drid);
		}
		return message;
	},
	callbacks.priority.LOW,
	'PropagateDiscussionMetadata',
);

callbacks.add(
	'afterDeleteRoom',
	(rid) => {
		Rooms.find({ prid: rid }, { fields: { _id: 1 } }).forEach(({ _id }) => deleteRoom(_id));
		return rid;
	},
	callbacks.priority.LOW,
	'DeleteDiscussionChain',
);

// TODO discussions define new fields
callbacks.add(
	'afterRoomNameChange',
	(roomConfig) => {
		const { rid, name, oldName } = roomConfig;
		Rooms.update({ prid: rid, ...(oldName && { topic: oldName }) }, { $set: { topic: name } }, { multi: true });
		return roomConfig;
	},
	callbacks.priority.LOW,
	'updateTopicDiscussion',
);

callbacks.add(
	'afterDeleteRoom',
	(drid) => {
		Messages.update(
			{ drid },
			{
				$unset: {
					dcount: 1,
					dlm: 1,
					drid: 1,
				},
			},
		);
		return drid;
	},
	callbacks.priority.LOW,
	'CleanDiscussionMessage',
);
