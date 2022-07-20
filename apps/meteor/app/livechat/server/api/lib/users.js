import { escapeRegExp } from '@rocket.chat/string-helpers';
import { Users } from '@rocket.chat/models';

import { hasAllPermissionAsync, hasAtLeastOnePermissionAsync } from '../../../../authorization/server/functions/hasPermission';

/**
 * @param {IRole['_id']} role the role id
 * @param {string} text
 * @param {any} pagination
 */
async function findUsers({ role, text, pagination: { offset, count, sort } }) {
	const query = {};
	if (text) {
		const filterReg = new RegExp(escapeRegExp(text), 'i');
		Object.assign(query, {
			$or: [{ username: filterReg }, { name: filterReg }, { 'emails.address': filterReg }],
		});
	}

	const { cursor, totalCount } = Users.findPaginatedUsersInRolesWithQuery(role, query, {
		sort: sort || { name: 1 },
		skip: offset,
		limit: count,
		projection: {
			username: 1,
			name: 1,
			status: 1,
			statusLivechat: 1,
			emails: 1,
			livechat: 1,
		},
	});

	const [users, total] = await Promise.all([cursor.toArray(), totalCount]);

	return {
		users,
		count: users.length,
		offset,
		total,
	};
}
export async function findAgents({ userId, text, pagination: { offset, count, sort } }) {
	if (!(await hasAtLeastOnePermissionAsync(userId, ['manage-livechat-agents', 'transfer-livechat-guest', 'edit-omnichannel-contact']))) {
		throw new Error('error-not-authorized');
	}

	return findUsers({
		role: 'livechat-agent',
		userId,
		text,
		pagination: {
			offset,
			count,
			sort,
		},
	});
}

export async function findManagers({ userId, text, pagination: { offset, count, sort } }) {
	if (!(await hasAllPermissionAsync(userId, ['view-livechat-manager', 'manage-livechat-agents']))) {
		throw new Error('error-not-authorized');
	}

	return findUsers({
		role: 'livechat-manager',
		userId,
		text,
		pagination: {
			offset,
			count,
			sort,
		},
	});
}
