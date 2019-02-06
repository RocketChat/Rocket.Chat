import { LivechatDepartment } from 'meteor/rocketchat:models';

RocketChat.Migrations.add({
	version: 67,
	up() {
		if (LivechatDepartment) {
			LivechatDepartment.model.update({}, {
				$set: {
					showOnRegistration: true,
				},
			}, { multi: true });
		}
	},
});
