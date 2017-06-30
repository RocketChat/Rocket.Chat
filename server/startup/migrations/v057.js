RocketChat.Migrations.add({
	version: 57,
	up() {
		RocketChat.models.Messages.find({ _id: /slack-([a-zA-Z0-9]+)S([0-9]+-[0-9]+)/ }).forEach(function(message) {
			const oldId = message._id;
			message._id = message._id.replace(/slack-([a-zA-Z0-9]+)S([0-9]+-[0-9]+)/, 'slack-$1-$2');
			RocketChat.models.Messages.insert(message);
			RocketChat.models.Messages.remove({ _id: oldId });
		});

		RocketChat.models.Messages.find({ _id: /slack-slack/ }).forEach(function(message) {
			const oldId = message._id;
			message._id = message._id.replace('slack-slack', 'slack');
			RocketChat.models.Messages.insert(message);
			RocketChat.models.Messages.remove({ _id: oldId });
		});

		RocketChat.models.Messages.find({ _id: /\./ }).forEach(function(message) {
			const oldId = message._id;
			message._id = message._id.replace(/(.*)\.?S(.*)/, 'slack-$1-$2');
			message._id = message._id.replace(/\./g, '-');
			RocketChat.models.Messages.remove({ _id: message._id });
			RocketChat.models.Messages.insert(message);
			RocketChat.models.Messages.remove({ _id: oldId });
		});
	}
});
