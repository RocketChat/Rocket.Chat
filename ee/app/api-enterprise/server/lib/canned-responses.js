import { escapeRegExp } from '@rocket.chat/string-helpers';

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

export async function findAllCannedResponsesFilter({ userId, shortcut, text, scope, createdBy, tags = [], options = {} }) {
	if (!await hasPermissionAsync(userId, 'view-canned-responses')) {
		throw new Error('error-not-authorized');
	}
	const filter = new RegExp(escapeRegExp(text), 'i');

	const cursor = CannedResponse.find({
		...shortcut && { shortcut },
		...text && { $or: [{ shortcut: filter }, { text: filter }] },
		...scope && { scope },
		...createdBy && { 'createdBy.username': createdBy },
		...tags.length && {
			tags: {
				$in: tags,
			},
		},
	}, {
		sort: options.sort || { shortcut: 1 },
		skip: options.offset,
		limit: options.count,
	});
	const total = await cursor.count();
	const cannedResponses = await cursor.toArray();
	return {
		cannedResponses,
		total,
	};
}

export async function findOneCannedResponse({ userId, _id }) {
	if (!await hasPermissionAsync(userId, 'view-canned-responses')) {
		throw new Error('error-not-authorized');
	}
	const cannedResponse = CannedResponse.findOneById(_id);
	return cannedResponse;
}
