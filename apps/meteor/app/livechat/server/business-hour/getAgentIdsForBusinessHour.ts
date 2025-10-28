import type { IUser } from '@rocket.chat/core-typings';
import { LivechatDepartment, LivechatDepartmentAgents, Users } from '@rocket.chat/models';

const getAllAgentIdsWithoutDepartment = async (): Promise<string[]> => {
	// Fetch departments with agents excluding archived ones (disabled ones still can be tied to business hours)
	// Then find the agents that are not in any of those departments

	const departmentIds = (await LivechatDepartment.findNotArchived({ projection: { _id: 1 } }).toArray()).map(({ _id }) => _id);

	const agentIdsWithDepartment = await LivechatDepartmentAgents.findAllAgentsConnectedToListOfDepartments(departmentIds);

	const agentIdsWithoutDepartment = (
		await Users.findUsersInRolesWithQuery(
			'livechat-agent',
			{
				_id: { $nin: agentIdsWithDepartment },
			},
			{ projection: { _id: 1 } },
		).toArray()
	).map((user) => user._id);

	return agentIdsWithoutDepartment;
};

const getAllAgentIdsWithDepartmentNotConnectedToBusinessHour = async (): Promise<string[]> => {
	const activeDepartmentsWithoutBusinessHour = (
		await LivechatDepartment.findActiveDepartmentsWithoutBusinessHour({
			projection: { _id: 1 },
		}).toArray()
	).map((dept) => dept._id);

	const agentIdsWithDepartmentNotConnectedToBusinessHour = await LivechatDepartmentAgents.findAllAgentsConnectedToListOfDepartments(
		activeDepartmentsWithoutBusinessHour,
	);
	return agentIdsWithDepartmentNotConnectedToBusinessHour;
};

export const getAgentIdsForBusinessHour = async (): Promise<IUser['_id'][]> => {
	const [withoutDepartment, withDepartmentNotConnectedToBusinessHour] = await Promise.all([
		getAllAgentIdsWithoutDepartment(),
		getAllAgentIdsWithDepartmentNotConnectedToBusinessHour(),
	]);

	return [...new Set([...withoutDepartment, ...withDepartmentNotConnectedToBusinessHour])];
};
