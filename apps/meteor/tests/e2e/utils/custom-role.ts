import type { BaseTest } from './test';
import { Endpoints } from '@rocket.chat/rest-typings';

export async function createCustomRole(api: BaseTest['api'], data: Parameters<Endpoints['/v1/roles.create']['POST']>[0]) {
	return await api.post('/roles.create', data);
}

export async function deleteCustomRole(api: BaseTest['api'], roleId: string) {
	return await api.post('/roles.delete', { roleId });
}
