import { LivechatDepartment } from '../../../../../app/models/server';
import { callbacks } from '../../../../../lib/callbacks';

callbacks.add(
	'livechat.findDepartmentsWithBusinessUnits',
	async ({ businessUnitIds } = { businessUnitIds: [] }) => {
		console.log('enterprise code called', businessUnitIds);

		return LivechatDepartment.findByUnitIds(businessUnitIds, {
			fields: { _id: 1, name: 1, showOnRegistration: 1, showOnOfflineForm: 1 },
		}).fetch();
	},
	callbacks.priority.HIGH,
	'livechat-find-departments-with-business-units',
);
