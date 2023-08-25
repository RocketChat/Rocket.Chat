import { LivechatDepartment, LivechatDepartmentAgents, LivechatUnit } from '@rocket.chat/models';

import { helperLogger } from '../../lib/logger';

export const getDepartmentsWhichUserCanAccess = async (userId: string, includeDisabled = false): Promise<string[]> => {
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

	const monitoredDepartments = await LivechatUnit.findMonitoredDepartmentsByMonitorId(userId, includeDisabled);
	const combinedDepartments = [
		...departments.map((department) => department.departmentId),
		...monitoredDepartments.map((department) => department._id),
	];

	return [...new Set(combinedDepartments)];
};

export const hasAccessToDepartment = async (userId: string, departmentId: string): Promise<boolean> => {
	const department = await LivechatDepartmentAgents.findOneByAgentIdAndDepartmentId(userId, departmentId, { projection: { _id: 1 } });
	if (department) {
		helperLogger.debug(`User ${userId} has access to department ${departmentId} because they are an agent`);
		return true;
	}

	const monitorAccess = await LivechatDepartment.checkIfMonitorIsMonitoringDepartmentById(userId, departmentId);
	helperLogger.debug(
		`User ${userId} ${monitorAccess ? 'has' : 'does not have'} access to department ${departmentId} because they are a monitor`,
	);
	return monitorAccess;
};
