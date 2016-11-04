RocketChat.Migrations.add({
	version: 64,
	up: function() {
		RocketChat.models.Messages.find({ 't': 'room_changed_topic', 'msg': /</ }, { msg: 1 }).forEach(function(message) {
			let msg = s.escapeHTML(message.msg);
			RocketChat.models.Messages.update({ _id: message._id }, { $set: { msg: msg }});
		});
	}
});
