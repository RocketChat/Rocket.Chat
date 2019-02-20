import { Migrations } from 'meteor/rocketchat:migrations';
import { Messages } from 'meteor/rocketchat:models';

Migrations.add({
	version: 57,
	up() {
		Messages.find({ _id: /slack-([a-zA-Z0-9]+)S([0-9]+-[0-9]+)/ }).forEach(function(message) {
			const oldId = message._id;
			message._id = message._id.replace(/slack-([a-zA-Z0-9]+)S([0-9]+-[0-9]+)/, 'slack-$1-$2');
			Messages.insert(message);
			Messages.remove({ _id: oldId });
		});

		Messages.find({ _id: /slack-slack/ }).forEach(function(message) {
			const oldId = message._id;
			message._id = message._id.replace('slack-slack', 'slack');
			Messages.insert(message);
			Messages.remove({ _id: oldId });
		});

		Messages.find({ _id: /\./ }).forEach(function(message) {
			const oldId = message._id;
			message._id = message._id.replace(/(.*)\.?S(.*)/, 'slack-$1-$2');
			message._id = message._id.replace(/\./g, '-');
			Messages.remove({ _id: message._id });
			Messages.insert(message);
			Messages.remove({ _id: oldId });
		});
	},
});
