import type { IOmnichannelRoom, ILivechatDepartment } from '@rocket.chat/core-typings';
import type { Filter, FilterOperators } from 'mongodb';

import { getUnitsFromUser } from './units';

export const addQueryRestrictionsToRoomsModel = (originalQuery: Filter<IOmnichannelRoom> = {}) => {
	const query: Filter<IOmnichannelRoom> & FilterOperators<IOmnichannelRoom> = { ...originalQuery };

	const units = getUnitsFromUser();
	if (!Array.isArray(units)) {
		return query;
	}

	const expressions = query.$and || [];
	const condition = {
		$or: [{ departmentAncestors: { $in: units } }, { departmentId: { $in: units } }],
	};
	query.$and = [condition, ...expressions];
	return query;
};

export const addQueryRestrictionsToDepartmentsModel = (originalQuery: Filter<ILivechatDepartment> = {}) => {
	const query: Filter<ILivechatDepartment & { ancestors: string[] }> = { ...originalQuery, type: { $ne: 'u' } };

	const units = getUnitsFromUser();
	if (Array.isArray(units)) {
		query.ancestors = { $in: units };
	}

	return query;
};
