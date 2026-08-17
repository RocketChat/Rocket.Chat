import type { IRoom } from '@rocket.chat/core-typings';
import { Messages, Rooms, VideoConference } from '@rocket.chat/models';
import type { Updater } from '@rocket.chat/models';

import { callbacks } from '../../lib/callbacks';
import { updateAndNotifyParentRoomWithParentMessage } from '../../lib/messaging/discussions/updateAndNotifyParentRoomWithParentMessage';
import { deleteRoom } from '../../lib/rooms/deleteRoom';

/**
 * The messages count and the last message timestamp of the room are only written to the database
 * once every `afterSaveMessage` callback ran, so the changes staged for the message being saved
 * have to be applied on top of the stored room, otherwise the discussion metadata would always
 * be left one message behind.
 */
const withPendingRoomChanges = (room: IRoom, roomUpdater?: Updater<IRoom>): IRoom => {
	const { $inc, $set } = roomUpdater?.getRawUpdateFilter() ?? {};
	const pendingMsgs = typeof $inc?.msgs === 'number' ? $inc.msgs : 0;
	const pendingLm = $set?.lm instanceof Date ? $set.lm : undefined;

	return {
		...room,
		msgs: room.msgs + pendingMsgs,
		lm: pendingLm ?? room.lm,
	};
};

/**
 * We need to propagate the writing of new message in a discussion to the linking
 * system message
 */
callbacks.add(
	'afterSaveMessage',
	async (message, { room: { _id, prid }, roomUpdater }) => {
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

		await updateAndNotifyParentRoomWithParentMessage(withPendingRoomChanges(room, roomUpdater));

		return message;
	},
	callbacks.priority.LOW,
	'PropagateDiscussionMetadata',
);

callbacks.add(
	'afterDeleteMessage',
	async (message, { room: { _id, prid } }) => {
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
		const {
			room: { _id: rid },
			name,
			oldName,
		} = roomConfig;
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
