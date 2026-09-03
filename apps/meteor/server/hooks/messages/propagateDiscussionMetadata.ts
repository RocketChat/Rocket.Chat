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

const refreshDiscussionsContainingTypes = async (types: MessageTypesValues[]): Promise<boolean> => {
	try {
		const rids = await Messages.findDiscussionRoomIdsContainingTypes(types);
		const results = [];

		for await (const room of Rooms.findDiscussionsByIds(rids, { projection: { msgs: 1, lm: 1, sysMes: 1 } })) {
			results.push(
				await updateAndNotifyParentRoomWithParentMessage(room).then(
					() => true,
					(err) => {
						SystemLogger.error({ msg: 'Failed to refresh the message count of a discussion', err, rid: room._id });
						return false;
					},
				),
			);
		}

		return results.every(Boolean);
	} catch (err) {
		SystemLogger.error({ msg: 'Failed to refresh discussion message counts after hidden system messages change', err });
		return false;
	}
};

let hiddenSystemMessageTypes: Set<MessageTypesValues> | undefined;

settings.onReady(() => {
	hiddenSystemMessageTypes = expandHiddenSystemMessageTypes(settings.get<MessageTypesValues[]>('Hide_System_Messages'));
});

// sweeps are serialized so each one diffs against the baseline left by the previous one;
// a failed sweep keeps the baseline, so the next change re-sweeps the missed diff
let pendingSweep = Promise.resolve();

settings.change<MessageTypesValues[]>('Hide_System_Messages', (value) => {
	pendingSweep = pendingSweep.then(async () => {
		const currentTypes = expandHiddenSystemMessageTypes(value);
		const changedTypes = hiddenSystemMessageTypes && [...hiddenSystemMessageTypes.symmetricDifference(currentTypes)];

		if (changedTypes?.length && !(await refreshDiscussionsContainingTypes(changedTypes))) {
			return;
		}

		hiddenSystemMessageTypes = currentTypes;
	});
});
