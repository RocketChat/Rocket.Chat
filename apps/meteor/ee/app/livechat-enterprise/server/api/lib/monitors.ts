import { escapeRegExp } from '@rocket.chat/string-helpers';
import { Users } from '@rocket.chat/models';
import type { PaginatedResult } from '@rocket.chat/rest-typings';
import type { ILivechatMonitor, IUser } from '@rocket.chat/core-typings';

export async function findMonitors({
	text,
	pagination: { offset, count, sort },
}: {
	text?: string;
	pagination: {
		offset: number;
		count: number;
		sort: {
			[key: string]: 1 | -1;
		};
	};
}): Promise<PaginatedResult<{ monitors: ILivechatMonitor[] }>> {
	const query = {};
	if (text) {
		const filterReg = new RegExp(escapeRegExp(text), 'i');
		Object.assign(query, {
			$or: [{ username: filterReg }, { name: filterReg }, { 'emails.address': filterReg }],
		});
	}

	const { cursor, totalCount } = Users.findPaginatedUsersInRolesWithQuery<ILivechatMonitor>('livechat-monitor', query, {
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

	const [monitors, total] = await Promise.all([cursor.toArray(), totalCount]);

	return {
		monitors,
		count: monitors.length,
		offset,
		total,
	};
}

export async function findMonitorByUsername({ username }: { username: string }): Promise<IUser> {
	const user = await Users.findOne(
		{ username, roles: 'livechat-monitor' },
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

	if (!user) {
		throw new Error('invalid-user');
	}

	return user;
}
