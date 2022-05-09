import { Permissions } from '../../../../app/models/server/raw';

export const createPermissions = async (): Promise<void> => {
	Permissions.create('view-device-management', ['admin']);
	Permissions.create('logout-device-management', ['admin']);
	Permissions.create('block-ip-device-management', ['admin']);
};
