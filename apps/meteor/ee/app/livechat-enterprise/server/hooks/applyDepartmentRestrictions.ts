import type { FilterOperators } from 'mongodb';
import type { ILivechatDepartmentRecord } from '@rocket.chat/core-typings';

import { callbacks } from '../../../../../lib/callbacks';
import { addQueryRestrictionsToDepartmentsModel } from '../lib/query.helper';
import { hasRoleAsync } from '../../../../../app/authorization/server/functions/hasRole';
import { cbLogger } from '../lib/logger';

callbacks.add(
	'livechat.applyDepartmentRestrictions',
	async (originalQuery: FilterOperators<ILivechatDepartmentRecord> = {}, { userId }: { userId?: string | null } = { userId: null }) => {
		if (!userId || !(await hasRoleAsync(userId, 'livechat-monitor'))) {
			cbLogger.debug('Skipping callback. No user id provided or user is not a monitor');
			return originalQuery;
		}

		cbLogger.debug('Applying department query restrictions');
		return addQueryRestrictionsToDepartmentsModel(originalQuery);
	},
	callbacks.priority.HIGH,
	'livechat-apply-department-restrictions',
);
