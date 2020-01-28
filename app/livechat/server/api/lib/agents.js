import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { LivechatDepartmentAgents } from '../../../../models/server/raw';

export async function findAgentDepartments({ userId, agentId, pagination: { offset, count, sort } }) {
	if (!await hasPermissionAsync(userId, 'view-l-room')) {
		throw new Error('error-not-authorized');
	}

	const cursor = LivechatDepartmentAgents.find({ agentId }, {
		sort: sort || { name: 1 },
		skip: offset,
		limit: count,
	});

	const total = await cursor.count();

	const departments = await cursor.toArray();

	return {
		departments,
		count: departments.length,
		offset,
		total,
	};
}
