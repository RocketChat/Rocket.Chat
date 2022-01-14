import { Meteor } from 'meteor/meteor';

import { LivechatDepartment } from '../../../../../app/models/server';
import { callbacks } from '../../../../../lib/callbacks';
import { LivechatUnit } from '../../../models/server';

callbacks.add(
	'livechat.findDepartmentsWithBusinessUnits',
	async ({ businessUnit } = { businessUnit: '' }) => {
		const unit = LivechatUnit.findOneById(businessUnit, { fields: { _id: 1 } });
		if (!unit) {
			throw new Meteor.Error('error-unit-not-found', `Error! No Active Business Unit found with id: ${businessUnit}`);
		}

		return LivechatDepartment.findByUnitIds([businessUnit], {
			fields: { _id: 1, name: 1, showOnRegistration: 1, showOnOfflineForm: 1 },
		}).fetch();
	},
	callbacks.priority.HIGH,
	'livechat-find-departments-with-business-units',
);
