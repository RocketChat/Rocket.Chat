import { hasPermissionAsync } from '../../../../../app/authorization/server/functions/hasPermission';
import { hasRoleAsync } from '../../../../../app/authorization/server/functions/hasRole';
import CannedResponse from '../../../models/server/raw/CannedResponse';
import { LivechatDepartmentAgents } from '../../../../../app/models/server/raw';

export async function findAllCannedResponses({ userId }) {
	if (!await hasPermissionAsync(userId, 'view-canned-responses')) {
		throw new Error('error-not-authorized');
	}

	// If the user is an admin or livechat manager, get his own responses and all responses from all departments
	if (await hasRoleAsync(userId, ['admin', 'livechat-manager'])) {
		return CannedResponse.find({
			$or: [
				{
					scope: 'user',
					userId,
				},
				{
					scope: 'department',
				},
			],
		}).toArray();
	}

	// If the user it not any of the previous roles nor an agent, then get only his own responses
	if (!await hasRoleAsync(userId, 'livechat-agent')) {
		return CannedResponse.find({
			scope: 'user',
			userId,
		}).toArray();
	}

	// Last scenario: user is an agente, so get his own responses and those from the departments he is in
	const departments = await LivechatDepartmentAgents.find({
		agentId: userId,
	}, {
		fields: {
			departmentId: 1,
		},
	}).toArray();

	const departmentIds = departments.map((department) => department.departmentId);

	return CannedResponse.find({
		$or: [
			{
				scope: 'user',
				userId,
			},
			{
				scope: 'department',
				departmentId: {
					$in: departmentIds,
				},
			},
		],
	}).toArray();
}
