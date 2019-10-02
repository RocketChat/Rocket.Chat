import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { Roles } from '../../../../models/server/raw';

async function findUsers({ userId, role, pagination: { offset, count, sort } }) {
	if (!await hasPermissionAsync(userId, 'view-livechat-manager') || !await hasPermissionAsync(userId, 'manage-livechat-agents')) {
		throw new Error('error-not-authorized');
	}

	const cursor = await Roles.findUsersInRoles(role, undefined, {
		sort: sort || { name: 1 },
		skip: offset,
		limit: count,
	});

	const total = await cursor.count();

	const users = await cursor.toArray();

	return {
		users: users.map((user) => Object.assign({}, {
			_id: user._id,
			username: user.username,
			name: user.name,
			status: user.status,
			statusLivechat: user.statusLivechat,
			emails: user.emails,
		})),
		count: users.length,
		offset,
		total,
	};
}
export async function findAgents({ userId, pagination: { offset, count, sort } }) {
	return findUsers({
		role: 'livechat-agent',
		userId,
		pagination: {
			offset,
			count,
			sort,
		},
	});
}

export async function findManagers({ userId, pagination: { offset, count, sort } }) {
	return findUsers({
		role: 'livechat-manager',
		userId,
		pagination: {
			offset,
			count,
			sort,
		},
	});
}
