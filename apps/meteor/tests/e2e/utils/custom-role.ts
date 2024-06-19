import type { Endpoints } from '@rocket.chat/rest-typings';

import type { BaseTest } from './test';

export async function createCustomRole(api: BaseTest['api'], data: Parameters<Endpoints['/v1/roles.create']['POST']>[0]) {
	return api.post('/roles.create', data);
}

export async function deleteCustomRole(api: BaseTest['api'], roleId: string) {
	return api.post('/roles.delete', { roleId });
}
