import { Migrations } from '../../migrations';
import { LivechatDepartment } from '../../../app/models';

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
