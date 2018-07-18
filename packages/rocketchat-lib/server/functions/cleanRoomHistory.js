RocketChat.cleanRoomHistory = function({ rid, latest = new Date(), oldest = new Date('0001-01-01T00:00:00Z'), inclusive = true, limit = 0, excludePinned = true, filesOnly = false }) {
	const gt = inclusive ? '$gte' : '$gt';
	const lt = inclusive ? '$lte' : '$lt';

	const ts = { [gt]: oldest, [lt]: latest };

	const text = `_${ TAPi18n.__('File_removed_by_prune') }_`;

	let fileCount = 0;
	RocketChat.models.Messages.findFilesByRoomIdPinnedAndTimestamp(
		rid,
		excludePinned,
		ts,
		{ fields: { 'file._id': 1, pinned: 1 }, limit }
	).forEach(document => {
		FileUpload.getStore('Uploads').deleteById(document.file._id);
		fileCount++;
		if (filesOnly) {
			RocketChat.models.Messages.update({ _id: document._id }, { $unset: { file: 1 }, $set: { attachments: [{ color: '#FD745E', text }] } });
		}
	});
	if (filesOnly) {
		return fileCount;
	}

	let count = 0;
	if (limit) {
		count = RocketChat.models.Messages.removeByIdPinnedTimestampAndLimit(rid, excludePinned, ts, limit);
	} else {
		count = RocketChat.models.Messages.removeByIdPinnedAndTimestamp(rid, excludePinned, ts);
	}

	if (count) {
		RocketChat.Notifications.notifyRoom(rid, 'deleteMessageBulk', {
			rid,
			excludePinned,
			ts
		});
	}
	return count;
};
