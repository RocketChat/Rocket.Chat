import type { IRole } from '@rocket.chat/core-typings';

export function filterRoleList(
	roleList: Array<IRole['_id']>,
	rolesToFilterOut: Array<IRole['_id']>,
	rolesToFilterIn?: Array<IRole['_id']>,
): Array<IRole['_id']> {
	const filteredRoles = roleList.filter((roleId) => !rolesToFilterOut.includes(roleId));

	if (!rolesToFilterIn) {
		return filteredRoles;
	}

	return filteredRoles.filter((roleId) => rolesToFilterIn.includes(roleId));
}
