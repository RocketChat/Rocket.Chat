import { expect, type BaseTest } from './test';

type PermissionUpdate = { _id: string; roles: string[] };

export const updatePermissions = async (api: BaseTest['api'], permissions: PermissionUpdate[]): Promise<void> => {
	await expect(await api.post('/permissions.update', { permissions })).toBeOK();
};
