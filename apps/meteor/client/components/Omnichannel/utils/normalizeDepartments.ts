import type { DepartmentListItem } from '../Definitions/DepartmentsDefinitions';

export const normalizeDepartments = async (
	departments: DepartmentListItem[],
	selectedDepartment: DepartmentListItem | undefined,
): Promise<DepartmentListItem[]> => {
	if (!selectedDepartment) {
		return departments;
	}

	const isSelectedDepartmentAlreadyOnList = () => departments.some((department) => department._id === selectedDepartment._id);
	if (isSelectedDepartmentAlreadyOnList()) {
		return departments;
	}

	const { _id, label } = selectedDepartment;

	return [...departments, { _id, label, value: _id }];
};
