import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import type { FilterOperators } from 'mongodb';

import { hasRoleAsync } from '../../../../../app/authorization/server/functions/hasRole';
import { callbacks } from '../../../../../lib/callbacks';
import { cbLogger } from '../lib/logger';
import { getUnitsFromUser } from '../methods/getUnitsFromUserRoles';

export const addQueryRestrictionsToDepartmentsModel = async (originalQuery: FilterOperators<ILivechatDepartment> = {}, userId: string) => {
	const query: FilterOperators<ILivechatDepartment> = { ...originalQuery, type: { $ne: 'u' } };

	const units = await getUnitsFromUser(userId);
	if (Array.isArray(units)) {
		query.ancestors = { $in: units };
	}

	cbLogger.debug({ msg: 'Applying department query restrictions', userId, units });
	return query;
};

callbacks.add(
	'livechat.applyDepartmentRestrictions',
	async (originalQuery: FilterOperators<ILivechatDepartment> = {}, { userId }: { userId?: string | null } = { userId: null }) => {
		if (!userId || !(await hasRoleAsync(userId, 'livechat-monitor'))) {
			return originalQuery;
		}

		cbLogger.debug('Applying department query restrictions');
		return addQueryRestrictionsToDepartmentsModel(originalQuery, userId);
	},
	callbacks.priority.HIGH,
	'livechat-apply-department-restrictions',
);
