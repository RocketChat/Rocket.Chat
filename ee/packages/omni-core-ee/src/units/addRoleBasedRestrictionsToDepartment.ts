import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import type { Filter, FilterOperators } from 'mongodb';

import { getUnitsFromUser } from './getUnitsFromUser';
import { defaultLogger } from '../utils/logger';

export const addQueryRestrictionsToDepartmentsModel = async (originalQuery: FilterOperators<ILivechatDepartment> = {}, userId: string) => {
	const conditions: Filter<ILivechatDepartment>[] = [originalQuery, { type: { $ne: 'u' } }];
	const query: FilterOperators<ILivechatDepartment> = { $and: conditions };

	const units = await getUnitsFromUser(userId);
	if (Array.isArray(units)) {
		conditions.push({ $or: [{ ancestors: { $in: units } }, { _id: { $in: units } }] });
	}

	defaultLogger.debug({ msg: 'Applying department query restrictions', userId, units });
	return query;
};
