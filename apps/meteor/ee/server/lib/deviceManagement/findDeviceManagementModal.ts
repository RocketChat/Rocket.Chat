import { Meteor } from 'meteor/meteor';
import { ModalDismiss } from '@rocket.chat/models';

import { hasLicense } from '../../../app/license/server/license';

Meteor.methods({
	async findDeviceManagementModal(): Promise<boolean> {
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

		const modal = await ModalDismiss.findOne({ _modal: 'device-management', _user: this.userId }, { projection: { _id: 1 } });

		return !!modal;
	},
});
