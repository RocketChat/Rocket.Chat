import { getUnitsFromUser } from './units';

// TODO: We need to add a new index in the departmentAncestors field

export const addQueryRestrictionsToRoomsModel = async (originalQuery = {}) => {
	const query = { ...originalQuery };

	const units = await getUnitsFromUser();
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
