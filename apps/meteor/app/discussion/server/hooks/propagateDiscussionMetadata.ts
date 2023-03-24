import type { IRoom } from '@rocket.chat/core-typings';
import { Messages, Rooms } from '@rocket.chat/models';

import { callbacks } from '../../../../lib/callbacks';
import { Rooms as RoomsSync } from '../../../models/server';
import { deleteRoom } from '../../../lib/server';

/**
 * We need to propagate the writing of new message in a discussion to the linking
 * system message
 */
callbacks.add(
	'afterSaveMessage',
	async function (message, { _id, prid }) {
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

		await Messages.refreshDiscussionMetadata(room);

		return message;
	},
	callbacks.priority.LOW,
	'PropagateDiscussionMetadata',
);

callbacks.add(
	'afterDeleteMessage',
	async function (message, { _id, prid }) {
		if (prid) {
			const room = await Rooms.findOneById(_id, {
				projection: {
					msgs: 1,
					lm: 1,
				},
			});

			if (room) {
				await Messages.refreshDiscussionMetadata(room);
			}
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
		RoomsSync.find({ prid: rid }, { fields: { _id: 1 } }).forEach(({ _id }: Pick<IRoom, '_id'>) => deleteRoom(_id));
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
		RoomsSync.update({ prid: rid, ...(oldName && { topic: oldName }) }, { $set: { topic: name } }, { multi: true });
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
		return drid;
	},
	callbacks.priority.LOW,
	'CleanDiscussionMessage',
);
