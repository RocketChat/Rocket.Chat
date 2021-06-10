import { escapeHTML } from '@rocket.chat/string-helpers';

import { Migrations } from '../migrations';
import { Rooms, Messages } from '../../../app/models';

Migrations.add({
	version: 55,
	up() {
		Rooms.find({ topic: { $exists: 1, $ne: '' } }, { topic: 1 }).forEach(function(room) {
			const topic = escapeHTML(room.topic);
			Rooms.update({ _id: room._id }, { $set: { topic } });
			Messages.update({ t: 'room_changed_topic', rid: room._id }, { $set: { msg: topic } });
		});
	},
});
