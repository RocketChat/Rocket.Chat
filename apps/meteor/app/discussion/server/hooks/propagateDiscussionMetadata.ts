import type { IRoom } from '@rocket.chat/core-typings';
import { Messages, Rooms, VideoConference } from '@rocket.chat/models';

import { callbacks } from '../../../../lib/callbacks';
import { deleteRoom } from '../../../lib/server/functions/deleteRoom';
import { notifyOnMessageChange } from '../../../lib/server/lib/notifyListener';

const updateAndNotifyParentRoomWithParentMessage = async (room: IRoom): Promise<void> => {
	const parentMessage = await Messages.refreshDiscussionMetadata(room);
	if (!parentMessage) {
		return;
	}
	void notifyOnMessageChange({
		id: parentMessage._id,
		data: parentMessage,
	});
};

/**
 * We need to propagate the writing of new message in a discussion to the linking
 * system message
 */
callbacks.add(
	'afterSaveMessage',
	async (message, { room: { _id, prid } }) => {
		if (!prid) {
			return message;
		}

		const room = await Rooms.findOneById(_id, {
			projection: {
				msgs: 1,
				lm: 1,
			},
		});

		if (!room) {
			return message;
		}

		await updateAndNotifyParentRoomWithParentMessage(room);

		return message;
	},
	callbacks.priority.LOW,
	'PropagateDiscussionMetadata',
);

callbacks.add(
	'afterDeleteMessage',
	async (message, { _id, prid }) => {
		if (prid) {
			const room = await Rooms.findOneById(_id, {
				projection: {
					msgs: 1,
					lm: 1,
				},
			});

			if (room) {
				await updateAndNotifyParentRoomWithParentMessage(room);
			}
		}
		if (message.drid) {
			await deleteRoom(message.drid);
		}
		return message;
	},
	callbacks.priority.LOW,
	'PropagateDiscussionMetadata',
);

callbacks.add(
	'afterDeleteRoom',
	async (rid) => {
		for await (const { _id } of Rooms.find({ prid: rid }, { projection: { _id: 1 } })) {
			await deleteRoom(_id);
		}

		return rid;
	},
	callbacks.priority.LOW,
	'DeleteDiscussionChain',
);

// TODO discussions define new fields
callbacks.add(
	'afterRoomNameChange',
	async (roomConfig) => {
		const { rid, name, oldName } = roomConfig;
		await Rooms.updateMany({ prid: rid, ...(oldName && { topic: oldName }) }, { $set: { topic: name } });
		return roomConfig;
	},
	callbacks.priority.LOW,
	'updateTopicDiscussion',
);

callbacks.add(
	'afterDeleteRoom',
	async (drid) => {
		await Messages.updateMany(
			{ drid },
			{
				$unset: {
					dcount: 1,
					dlm: 1,
					drid: 1,
				},
			},
		);

		await VideoConference.unsetDiscussionRid(drid);
		return drid;
	},
	callbacks.priority.LOW,
	'CleanDiscussionMessage',
);
