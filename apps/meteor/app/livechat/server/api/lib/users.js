import { escapeRegExp } from '@rocket.chat/string-helpers';
import { Users } from '@rocket.chat/models';

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
export async function findAgents({ text, pagination: { offset, count, sort } }) {
	return findUsers({
		role: 'livechat-agent',
		text,
		pagination: {
			offset,
			count,
			sort,
		},
	});
}

export async function findManagers({ text, pagination: { offset, count, sort } }) {
	return findUsers({
		role: 'livechat-manager',
		text,
		pagination: {
			offset,
			count,
			sort,
		},
	});
}
