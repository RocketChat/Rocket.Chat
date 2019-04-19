import { Migrations } from '../../../app/migrations';
import { Rooms, Messages } from '../../../app/models';
import s from 'underscore.string';

Migrations.add({
	version: 55,
	up() {
		Rooms.find({ topic: { $exists: 1, $ne: '' } }, { topic: 1 }).forEach(function(room) {
			const topic = s.escapeHTML(room.topic);
			Rooms.update({ _id: room._id }, { $set: { topic } });
			Messages.update({ t: 'room_changed_topic', rid: room._id }, { $set: { msg: topic } });
		});
	},
});
