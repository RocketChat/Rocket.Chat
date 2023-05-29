import { LivechatDepartmentAgents, LivechatUnit } from '@rocket.chat/models';

export const getDepartmentsWhichUserCanAccess = async (userId: string): Promise<string[]> => {
	const departments = await LivechatDepartmentAgents.find(
		{
			agentId: userId,
		},
		{
			projection: {
				departmentId: 1,
			},
		},
	).toArray();

	const monitoredDepartments = await LivechatUnit.findMonitoredDepartmentsByMonitorId(userId);
	const combinedDepartments = [
		...departments.map((department) => department.departmentId),
		...monitoredDepartments.map((department) => department._id),
	];

	return [...new Set(combinedDepartments)];
};

export const hasAccessToDepartment = async (userId: string, departmentId: string): Promise<boolean> => {
	const department = await LivechatDepartmentAgents.findOneByAgentIdAndDepartmentId(userId, departmentId);
	if (department) {
		return true;
	}

	const monitoredDepartments = await LivechatUnit.findMonitoredDepartmentsByMonitorId(userId);
	if (monitoredDepartments.find((department) => department._id === departmentId)) {
		return true;
	}

	return false;
};
