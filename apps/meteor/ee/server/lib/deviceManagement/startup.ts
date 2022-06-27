import { IModal } from '@rocket.chat/core-typings';

import { Modals, Permissions } from '../../../../app/models/server/raw/index';

export const createPermissions = async (): Promise<void> => {
	Permissions.create('view-device-management', ['admin']);
	Permissions.create('logout-device-management', ['admin']);
	Permissions.create('block-ip-device-management', ['admin']);
};

export const createDeviceManagementModal = async (): Promise<void> => {
	const modal = await Modals.findOneById<IModal>('device-management', { projection: { _id: 1 } });
	modal ??
		Modals.insertOne({
			_id: 'device-management',
			title: 'Device Management',
			content: '',
			contentType: 'text',
			createdAt: new Date(),
			expires: null,
			status: true,
		});
};
