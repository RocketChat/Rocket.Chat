import { Permissions } from '../../../../app/models/server/raw';

export const createPermissions = async (): Promise<void> => {
	Permissions.create('view-modal-management', ['admin']);
};
