import { Statistics } from 'meteor/rocketchat:models';

RocketChat.Migrations.add({
	version: 59,
	up() {
		const users = RocketChat.models.Users.find({}, { sort: { createdAt: 1 }, limit: 1 }).fetch();
		if (users && users.length > 0) {
			const { createdAt } = users[0];
			RocketChat.models.Settings.update({ createdAt: { $exists: 0 } }, { $set: { createdAt } }, { multi: true });
			Statistics.update({ installedAt: { $exists: 0 } }, { $set: { installedAt: createdAt } }, { multi: true });
		}
	},
});
