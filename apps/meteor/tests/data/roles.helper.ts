import type { Credentials } from '@rocket.chat/api-client';
import type { IRole } from '@rocket.chat/core-typings';

import { api, credentials, request } from './api-data';

export const createCustomRole = async ({
	name,
	scope,
	description,
	credentials: customCredentials,
}: Pick<IRole, 'name' | 'scope' | 'description'> & { credentials?: Credentials }) => {
	const response = await request
		.post(api('roles.create'))
		.set(customCredentials || credentials)
		.send({ name, scope, description });
	return response.body.role as IRole;
};

export const deleteCustomRole = async ({ roleId, credentials: customCredentials }: { roleId: IRole['_id']; credentials?: Credentials }) => {
	const response = await request
		.post(api('roles.delete'))
		.set(customCredentials || credentials)
		.send({ roleId });
	return response.body.success as boolean;
};

export const assignRoleToUser = async ({
	username,
	roleId,
	credentials: customCredentials,
}: {
	username: string;
	roleId: string;
	credentials?: Credentials;
}) => {
	const response = await request
		.post(api('roles.addUserToRole'))
		.set(customCredentials || credentials)
		.send({ username, roleId });
	return response.body.success as boolean;
};
