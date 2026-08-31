import type { BaseTest } from './test';

export const getPermissionRoles = async (api: BaseTest['api'], permissionId: string): Promise<string[]> => {
	const res = await api.get('/permissions.listAll');
	const { update } = await res.json();
	return update.find((p: { _id: string }) => p._id === permissionId)?.roles ?? [];
};
