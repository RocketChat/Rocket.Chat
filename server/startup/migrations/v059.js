import { Migrations } from '/app/migrations';
import { Users, Settings, Statistics } from '/app/models';

Migrations.add({
	version: 59,
	up() {
		const users = Users.find({}, { sort: { createdAt: 1 }, limit: 1 }).fetch();
		if (users && users.length > 0) {
			const { createdAt } = users[0];
			Settings.update({ createdAt: { $exists: 0 } }, { $set: { createdAt } }, { multi: true });
			Statistics.update({ installedAt: { $exists: 0 } }, { $set: { installedAt: createdAt } }, { multi: true });
		}
	},
});
