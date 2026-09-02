import type { MessageTypesValues } from '@rocket.chat/core-typings';
import { Messages, Rooms, VideoConference } from '@rocket.chat/models';

import { callbacks } from '../../lib/callbacks';
import { SystemLogger } from '../../lib/logger/system';
import {
	expandHiddenSystemMessageTypes,
	incrementAndNotifyParentRoomWithParentMessage,
	updateAndNotifyParentRoomWithParentMessage,
} from '../../lib/messaging/discussions/updateAndNotifyParentRoomWithParentMessage';
import { deleteRoom } from '../../lib/rooms/deleteRoom';
import { settings } from '../../settings/cached';

/**
 * We need to propagate the writing of new message in a discussion to the linking
 * system message.
 *
 * The messages count and the last message timestamp of the room are only written to the database
 * once every `afterSaveMessage` callback ran, so the changes staged for the message being saved
 * have to be read from the updater, otherwise the discussion metadata would always be left one
 * message behind.
 */
callbacks.add(
	'afterSaveMessage',
	async (message, { room: { _id, prid }, roomUpdater }) => {
		if (!prid) {
			return message;
		}

		const room = await Rooms.findOneById(_id, {
			projection: {
				lm: 1,
				sysMes: 1,
			},
		});

		if (!room) {
			return message;
		}

		const { $inc, $set } = roomUpdater?.getRawUpdateFilter() ?? {};
		const countDelta = typeof $inc?.msgs === 'number' ? $inc.msgs : 0;
		const lm = $set?.lm instanceof Date ? $set.lm : room.lm;

		await incrementAndNotifyParentRoomWithParentMessage({ ...room, lm }, message.t, countDelta);

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
					lm: 1,
					sysMes: 1,
				},
			});

			if (room) {
				await incrementAndNotifyParentRoomWithParentMessage(room, message.t, -1);
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

let hiddenSystemMessageTypes: Set<MessageTypesValues> | undefined;

settings.onReady(() => {
	hiddenSystemMessageTypes = expandHiddenSystemMessageTypes(settings.get<MessageTypesValues[]>('Hide_System_Messages'));
});

/**
 * The globally hidden system message types are an input of the incrementally maintained
 * discussion message counts, so changing them requires refreshing the stored counts.
 */
settings.change<MessageTypesValues[]>('Hide_System_Messages', async (value) => {
	const previousTypes = hiddenSystemMessageTypes;
	const currentTypes = expandHiddenSystemMessageTypes(value);

	const changedTypes = previousTypes && [...previousTypes.symmetricDifference(currentTypes)];
	if (!changedTypes?.length) {
		hiddenSystemMessageTypes = currentTypes;
		return;
	}

	try {
		const rids = await Messages.findDiscussionRoomIdsContainingTypes(changedTypes);

		for await (const room of Rooms.findDiscussionsByIds(rids, { projection: { msgs: 1, lm: 1, sysMes: 1 } })) {
			await updateAndNotifyParentRoomWithParentMessage(room);
		}

		// only committed after a successful refresh so the next change retries any failed diff
		hiddenSystemMessageTypes = currentTypes;
	} catch (err) {
		SystemLogger.error({ msg: 'Failed to refresh discussion message counts after hidden system messages change', err });
	}
});
