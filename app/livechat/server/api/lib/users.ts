import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { escapeRegExp } from '@rocket.chat/string-helpers';

import { hasAllPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { Users } from '../../../../models/server/raw';

async function findUsers({
	_userId,
	role,
	text,
	pagination,
}: {
	_userId: string;
	role: string;
	text: string;
	pagination: { offset: number; count: number; sort: string };
}): Promise<{ users: IUser[]; count: number; offset: number; total: number }> {
	const query = {};
	if (text) {
		const filterReg = new RegExp(escapeRegExp(text), 'i');
		Object.assign(query, {
			$or: [{ username: filterReg }, { name: filterReg }, { 'emails.address': filterReg }],
		});
	}

	const cursor = await Users.findUsersInRolesWithQuery(role, query, {
		sort: pagination.sort || { name: 1 },
		skip: pagination.offset,
		limit: pagination.count,
		projection: {
			username: 1,
			name: 1,
			status: 1,
			statusLivechat: 1,
			emails: 1,
			livechat: 1,
		},
	});

	const total = await cursor.count();

	const users = await cursor.toArray();

	return {
		users,
		count: users.length,
		offset: pagination.offset,
		total,
	};
}
export async function findAgents({
	userId,
	text,
	pagination,
}: {
	userId: string;
	text: string;
	pagination: { offset: number; count: number; sort: string };
}): Promise<{
	users: IUser[];
	count: number;
	offset: number;
	total: number;
}> {
	if (!(await hasAllPermissionAsync(userId, ['view-l-room', 'transfer-livechat-guest']))) {
		throw new Error('error-not-authorized');
	}

	return findUsers({
		role: 'livechat-agent',
		_userId: userId,
		text,
		pagination: {
			offset: pagination.offset,
			count: pagination.count,
			sort: pagination.sort,
		},
	});
}

export async function findManagers({
	userId,
	text,
	pagination,
}: {
	userId: string;
	text: string;
	pagination: { offset: number; count: number; sort: string };
}): Promise<{
	users: IUser[];
	count: number;
	offset: number;
	total: number;
}> {
	if (!(await hasAllPermissionAsync(userId, ['view-livechat-manager', 'manage-livechat-agents']))) {
		throw new Error('error-not-authorized');
	}

	return findUsers({
		role: 'livechat-manager',
		_userId: userId,
		text,
		pagination: {
			offset: pagination.offset,
			count: pagination.count,
			sort: pagination.sort,
		},
	});
}
