

import {
	LivechatDepartment,
} from '../../../../../app/models/server/raw';

export const findAllDepartmentsAvailable = async (unitId, offset, count) => {
	const cursor = LivechatDepartment.find({
		ancestors: { $nin: [unitId] },
	}, { limit: count, offset });

	const departments = await cursor.toArray();
	const departmentsFiltered = departments.filter((department) => !department.ancestors?.length);

	return { departments: departmentsFiltered, total: departments.length };
};

export const findAllDepartmentsByUnit = async (unitId, offset, count) => {
	const cursor = LivechatDepartment.find({
		ancestors: { $in: [unitId] },
	}, { limit: count, offset });

	const departments = await cursor.toArray();

	return { departments, total: departments.length };
};
