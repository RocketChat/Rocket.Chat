import { escapeRegExp } from '@rocket.chat/string-helpers';

import { hasPermissionAsync } from '../../../../../../app/authorization/server/functions/hasPermission';
import { Users } from '../../../../../../app/models/server/raw';

export async function findMonitors({ userId, text, pagination: { offset, count, sort } }) {
	if (!(await hasPermissionAsync(userId, 'manage-livechat-monitors'))) {
		throw new Error('error-not-authorized');
	}
	const query = {};
	if (text) {
		const filterReg = new RegExp(escapeRegExp(text), 'i');
		Object.assign(query, {
			$or: [{ username: filterReg }, { name: filterReg }, { 'emails.address': filterReg }],
		});
	}

	const cursor = Users.findUsersInRolesWithQuery('livechat-monitor', query, {
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

	const total = await cursor.count();

	const monitors = await cursor.toArray();

	return {
		monitors,
		count: monitors.length,
		offset,
		total,
	};
}

export async function findMonitorByUsername({ userId, username }) {
	if (!(await hasPermissionAsync(userId, 'manage-livechat-monitors'))) {
		throw new Error('error-not-authorized');
	}
	const user = await Users.findOne(
		{ username },
		{
			projection: {
				username: 1,
				name: 1,
				status: 1,
				statusLivechat: 1,
				emails: 1,
				livechat: 1,
			},
		},
	);

	if (!user || !(await Users.isUserInRole(user._id, 'livechat-monitor'))) {
		throw new Error('invalid-user');
	}

	return user;
}
