import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { deleteRoom } from './deleteRoom';
import { FileUpload } from '../../../file-upload';
import { Rooms, RoomEvents } from '../../../models';
import { Notifications } from '../../../notifications';

export const cleanRoomHistory = async function({ rid, latest = new Date(), oldest = new Date('0001-01-01T00:00:00Z'), inclusive = true, limit = 0, excludePinned = true, ignoreDiscussion = true, filesOnly = false, fromUsers = [] }) {
	console.log('cleanRoomHistory limit', limit);
	const gt = inclusive ? '$gte' : '$gt';
	const lt = inclusive ? '$lte' : '$lt';

	const options = {
		rid: { $eq: rid },
		t: { $eq: 'msg' },
		'd.t': { $in: ['msg'] },
		ts: { [gt]: oldest, [lt]: latest },
		'd.u.username': { $exists: true }, // this changes below if necessary
		_deletedAt: { $exists: false }, // since we don't need something is already deleted
	};
	if (!excludePinned) {
		options['d.t'].$in.push('message_pinned');
	} else {
		options['d.pinned'] = { $exists: false };
	}

	// change first defined users value in case there are a fromUsers option selected
	if (fromUsers && fromUsers.length) {
		options['d.u.username'] = { $in: fromUsers };
	}

	console.log('cleanRoomHistory options', options);

	const prunedText = `_${ TAPi18n.__('File_removed_by_prune') }_`;

	let fileCount = 0;

	const attachmentEventMessages = await RoomEvents.find({
		'd.file._id': { $exists: 1 },
		...options,
	});

	attachmentEventMessages.forEach((item) => {
		const { d = {} } = item;
		const { file = {} } = d;

		FileUpload.getStore('Uploads').deleteById(file._id);
		fileCount++;
		if (filesOnly) {
			RoomEvents.update({
				_id: item._id,
			}, {
				$unset: { 'd.file': 1 },
				$set: { 'd.attachments': [{ color: '#FD745E', prunedText }] },
				$currentDate: { _deletedAt: true },
			});
		}
	});

	if (filesOnly) {
		return fileCount;
	}

	if (!ignoreDiscussion) {
		const discussionEvents = await RoomEvents.find({
			'd.drid': { $exists: true },
			...options,
		});

		discussionEvents.forEach((discussion) => {
			const { d = {} } = discussion;
			const { drid = '' } = d;

			RoomEvents.update({
				_id: discussion._id,
			}, {
				$currentDate: { _deletedAt: true },
			});

			deleteRoom(drid);
			fileCount += 1;
		});
	}

	const result = await RoomEvents.createPruneMessagesEvent(options);

	// clean up this and its method at Messages model since it's not used anymore
	// const count = Messages.removeByIdPinnedTimestampLimitAndUsers(rid, excludePinned, ignoreDiscussion, ts, limit, fromUsers);
	if (result.count || fileCount) {
		Rooms.resetLastMessageById(rid);
		Notifications.notifyRoom(rid, 'deleteMessageBulk', {
			rid,
			excludePinned,
			ignoreDiscussion,
			ts: options.ts,
			users: fromUsers,
		});
	}
	return result.count + fileCount;
};
