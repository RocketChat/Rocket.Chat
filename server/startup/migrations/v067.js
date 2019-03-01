import { Migrations } from 'meteor/rocketchat:migrations';
import { LivechatDepartment } from 'meteor/rocketchat:models';

Migrations.add({
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
