import type { ILivechatBusinessHour } from '@rocket.chat/core-typings';
import { LivechatBusinessHours, LivechatDepartment } from '@rocket.chat/models';
import { escapeRegExp } from '@rocket.chat/string-helpers';

import { hasPermissionAsync } from '../../../../../../app/authorization/server/functions/hasPermission';
import type { IPaginatedResponse, IPagination } from '../../api/lib/definition';

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
	const { cursor, totalCount } = LivechatBusinessHours.findPaginated(query, {
		sort: sort || { name: 1 },
		skip: offset,
		limit: count,
	});

	const [businessHours, total] = await Promise.all([cursor.toArray(), totalCount]);

	// add departments to businessHours
	const businessHoursWithDepartments = await Promise.all(
		businessHours.map(async (businessHour) => {
			const currentDepartments = await LivechatDepartment.findByBusinessHourId(businessHour._id, {
				projection: { _id: 1 },
			}).toArray();

			if (currentDepartments.length) {
				businessHour.departments = currentDepartments;
			}

			return businessHour;
		}),
	);

	return {
		businessHours: businessHoursWithDepartments,
		count: businessHours.length,
		offset,
		total,
	};
}
