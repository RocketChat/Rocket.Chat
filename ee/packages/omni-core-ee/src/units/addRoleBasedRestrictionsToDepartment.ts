import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import type { FilterOperators } from 'mongodb';

import { getUnitsFromUser } from './getUnitsFromUser';
import { defaultLogger } from '../utils/logger';

export const addQueryRestrictionsToDepartmentsModel = async (originalQuery: FilterOperators<ILivechatDepartment> = {}, userId: string) => {
	const query: FilterOperators<ILivechatDepartment> = { $and: [originalQuery, { type: { $ne: 'u' } }] };

	const units = await getUnitsFromUser(userId);
	if (Array.isArray(units)) {
		query.$and.push({ $or: [{ ancestors: { $in: units } }, { _id: { $in: units } }] });
	}

	defaultLogger.debug({ msg: 'Applying department query restrictions', userId, units });
	return query;
};
