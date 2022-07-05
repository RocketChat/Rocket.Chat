import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { ILivechatBusinessHour } from '@rocket.chat/core-typings';
import { LivechatBusinessHours } from '@rocket.chat/models';

import { hasPermissionAsync } from '../../../../../../app/authorization/server/functions/hasPermission';
import { IPaginatedResponse, IPagination } from '../../api/lib/definition';

interface IResponse extends IPaginatedResponse {
	businessHours: ILivechatBusinessHour[];
}

export async function findBusinessHours(userId: string, { offset, count, sort }: IPagination, name?: string): Promise<IResponse> {
	if (!(await hasPermissionAsync(userId, 'view-livechat-business-hours'))) {
		throw new Error('error-not-authorized');
	}
	const query = {};
	if (name) {
		const filterReg = new RegExp(escapeRegExp(name), 'i');
		Object.assign(query, { name: filterReg });
	}
	const cursor = LivechatBusinessHours.find(query, {
		sort: sort || { name: 1 },
		skip: offset,
		limit: count,
	});

	const total = await cursor.count();

	const businessHours = await cursor.toArray();

	return {
		businessHours,
		count: businessHours.length,
		offset,
		total,
	};
}
