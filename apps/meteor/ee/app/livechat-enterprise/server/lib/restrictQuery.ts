import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatDepartment } from '@rocket.chat/models';
import type { FilterOperators } from 'mongodb';

import { cbLogger } from './logger';
import { getUnitsFromUser } from './units';

export const restrictQuery = async (originalQuery: FilterOperators<IOmnichannelRoom> = {}, unitsFilter?: string[]) => {
	const query = { ...originalQuery };

	let userUnits = await getUnitsFromUser();
	if (!Array.isArray(userUnits)) {
		if (Array.isArray(unitsFilter) && unitsFilter.length) {
			return { ...query, departmentAncestors: { $in: unitsFilter } };
		}
		return query;
	}

	if (Array.isArray(unitsFilter) && unitsFilter.length) {
		const userUnit = new Set([...userUnits]);
		const filteredUnits = new Set(unitsFilter);

		// IF user is trying to filter by a unit he doens't have access to, apply empty filter (no matches)
		userUnits = [...userUnit.intersection(filteredUnits)];
	}
	// TODO: units is meant to include units and departments, however, here were only using them as units
	// We have to change the filter to something like { $or: [{ ancestors: {$in: units }}, {_id: {$in: units}}] }
	const departments = await LivechatDepartment.find({ ancestors: { $in: userUnits } }, { projection: { _id: 1 } }).toArray();

	const expressions = query.$and || [];
	const condition = {
		$or: [{ departmentAncestors: { $in: userUnits } }, { departmentId: { $in: departments.map(({ _id }) => _id) } }],
	};
	query.$and = [condition, ...expressions];

	cbLogger.debug({ msg: 'Applying room query restrictions', userUnits });
	return query;
};
