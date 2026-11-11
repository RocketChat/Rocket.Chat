import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import type { Filter } from 'mongodb';

import { getUnitsFromUser } from './getUnitsFromUser';
import { defaultLogger } from '../utils/logger';

export const addQueryRestrictionsToDepartmentsModel = async (originalQuery: Filter<ILivechatDepartment> = {}, userId: string) => {
	const query = { $and: [originalQuery, { type: { $ne: 'u' } }] } satisfies Filter<ILivechatDepartment>;

	const units = await getUnitsFromUser(userId);
	if (Array.isArray(units)) {
		query.$and.push({ $or: [{ ancestors: { $in: units } }, { _id: { $in: units } }] });
	}

	defaultLogger.debug({ msg: 'Applying department query restrictions', userId, units });
	return query;
};
