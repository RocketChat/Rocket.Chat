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
		helperLogger.debug({
			msg: 'User has access to department as agent',
			userId,
			departmentId,
		});
		return true;
	}

	const monitorAccess = await LivechatDepartment.checkIfMonitorIsMonitoringDepartmentById(userId, departmentId);
	helperLogger.debug({
		msg: 'User monitor access status for department',
		userId,
		departmentId,
		hasAccess: monitorAccess,
	});
	return monitorAccess;
};
