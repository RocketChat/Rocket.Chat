import s from 'underscore.string';

RocketChat.Migrations.add({
	version: 64,
	up() {
		RocketChat.models.Messages.find({ 't': 'room_changed_topic', 'msg': /</ }, { msg: 1 }).forEach(function(message) {
			const msg = s.escapeHTML(message.msg);
			RocketChat.models.Messages.update({ _id: message._id }, { $set: { msg }});
		});
	}
});
