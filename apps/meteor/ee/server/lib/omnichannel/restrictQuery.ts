import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatDepartment } from '@rocket.chat/models';
import { getUnitsFromUser } from '@rocket.chat/omni-core-ee';
import type { FilterOperators } from 'mongodb';

import { cbLogger } from './logger';

export const restrictQuery = async ({
	originalQuery = {},
	unitsFilter,
	userId,
}: {
	originalQuery?: FilterOperators<IOmnichannelRoom>;
	unitsFilter?: string[];
	userId?: string;
}) => {
	const query = { ...originalQuery };

	let userUnits = await getUnitsFromUser(userId);
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

	const departments = await LivechatDepartment.find(
		{ $or: [{ ancestors: { $in: userUnits } }, { _id: { $in: userUnits } }] },
		{ projection: { _id: 1 } },
	).toArray();

	const expressions = query.$and || [];
	const condition = {
		$or: [
			{ departmentAncestors: { $in: userUnits } },
			{ departmentId: { $in: departments.map(({ _id }) => _id) } },
			{ departmentId: { $exists: false } },
		],
	};
	query.$and = [condition, ...expressions];

	cbLogger.debug({ msg: 'Applying room query restrictions', userUnits, query });
	return query;
};
