import { Meteor } from 'meteor/meteor';

import { Modals } from '../../../../app/models/server/raw/index';
import { hasLicense } from '../../../app/license/server/license';

Meteor.methods({
	async deviceManagementModal() {
		if (!this.userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'deviceManagementModal',
			});
		}
		if (!hasLicense('device-management')) {
			throw new Meteor.Error('error-license-not-found', 'License not found', {
				method: 'deviceManagementModal',
			});
		}

		const modal = await Modals.findOneByIdAndUserId('device-management', this.userId, { projection: { _id: 1 } });
		return modal;
	},
});
