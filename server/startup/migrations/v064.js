import { Migrations } from '../../../app/migrations';
import { Messages } from '../../../app/models';
import { escapeHTML } from '../../../lib/escapeHTML';

Migrations.add({
	version: 64,
	up() {
		Messages.find({ t: 'room_changed_topic', msg: /</ }, { msg: 1 }).forEach(function(message) {
			const msg = escapeHTML(message.msg);
			Messages.update({ _id: message._id }, { $set: { msg } });
		});
	},
});
