import type { EndpointFunction } from '@rocket.chat/ui-contexts';

import type { DepartmentListItem } from '../Definitions/DepartmentsDefinitions';

export const normalizeDepartments = async (
	departments: DepartmentListItem[],
	selectedDepartment: string,
	getDepartment: EndpointFunction<'GET', '/v1/livechat/department/:_id'>,
): Promise<DepartmentListItem[]> => {
	const isSelectedDepartmentAlreadyOnList = () => departments.some((department) => department._id === selectedDepartment);
	if (!selectedDepartment || selectedDepartment === 'all' || isSelectedDepartmentAlreadyOnList()) {
		return departments;
	}

	try {
		const { department: missingDepartment } = await getDepartment({});

		return missingDepartment
			? [...departments, { _id: missingDepartment._id, label: missingDepartment.name, value: missingDepartment._id }]
			: departments;
	} catch {
		return departments;
	}
};
