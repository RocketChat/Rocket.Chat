

import {
	LivechatDepartment,
} from '../../../../../app/models/server/raw';

export const findAllDepartments = async (unitId, offset, count) => {
	const cursor = LivechatDepartment.find({
		ancestors: { $nin: [unitId] },
	}, { limit: count, offset });

	const departments = await cursor.toArray();
	return departments.filter((department) => !department.ancestors?.length);
};
