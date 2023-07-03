import { escapeRegExp } from '@rocket.chat/string-helpers';
import { LivechatDepartmentAgents, CannedResponse, LivechatUnit, LivechatTag } from '@rocket.chat/models';

import { hasPermissionAsync } from '../../../../../app/authorization/server/functions/hasPermission';

const getTagsInformation = async (cannedResponses) => {
	return Promise.all(
		cannedResponses.map(async (cannedResponse) => {
			const { tags } = cannedResponse;

			const serverTags = await LivechatTag.find({ _id: { $in: tags } }, { projection: { _id: 1, name: 1 } }).toArray();

			// filter out tags that were found
			const newTags = tags.reduce((acc, tag) => {
				const found = serverTags.find((serverTag) => serverTag._id === tag);
				if (found) {
					acc.push(found.name);
				} else {
					acc.push(tag);
				}
				return acc;
			}, []);

			// Known limitation: if a tag was added and removed before this, it will return the tag id instead of the name
			cannedResponse.tags = newTags;

			return cannedResponse;
		}),
	);
};

export async function findAllCannedResponses({ userId }) {
	// If the user is an admin or livechat manager, get his own responses and all responses from all departments
	if (await hasPermissionAsync(userId, 'view-all-canned-responses')) {
		const cannedResponses = await CannedResponse.find({
			$or: [
				{
					scope: 'user',
					userId,
				},
				{
					scope: 'department',
				},
				{
					scope: 'global',
				},
			],
		}).toArray();
		return getTagsInformation(cannedResponses);
	}

	// If the user it not any of the previous roles nor an agent, then get only his own responses
	if (!(await hasPermissionAsync(userId, 'view-agent-canned-responses'))) {
		const cannedResponses = await CannedResponse.find({
			scope: 'user',
			userId,
		}).toArray();
		return getTagsInformation(cannedResponses);
	}

	// Last scenario: user is an agente, so get his own responses and those from the departments he is in
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

	const cannedResponses = await CannedResponse.find({
		$or: [
			{
				scope: 'user',
				userId,
			},
			{
				scope: 'department',
				departmentId: {
					$in: combinedDepartments,
				},
			},
			{
				scope: 'global',
			},
		],
	}).toArray();

	return getTagsInformation(cannedResponses);
}

export async function findAllCannedResponsesFilter({ userId, shortcut, text, departmentId, scope, createdBy, tags = [], options = {} }) {
	let extraFilter = [];
	// if user cannot see all, filter to private + public + departments user is in
	if (!(await hasPermissionAsync(userId, 'view-all-canned-responses'))) {
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

		const isDepartmentInScope = (departmentId) => !!combinedDepartments.includes(departmentId);

		const departmentIds = departmentId && isDepartmentInScope(departmentId) ? [departmentId] : combinedDepartments;

		extraFilter = [
			{
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
					{
						scope: 'global',
					},
				],
			},
		];
	}

	if (departmentId) {
		extraFilter = [
			{
				departmentId,
			},
		];
	}

	const textFilter = new RegExp(escapeRegExp(text), 'i');

	let filter = {
		$and: [
			...(shortcut ? [{ shortcut }] : []),
			...(text ? [{ $or: [{ shortcut: textFilter }, { text: textFilter }] }] : []),
			...(scope ? [{ scope }] : []),
			...(createdBy ? [{ 'createdBy._id': createdBy }] : []),
			...(tags.length
				? [
						{
							tags: {
								$in: tags,
							},
						},
				  ]
				: []),
			...extraFilter,
		],
	};

	if (!filter.$and.length) {
		filter = {};
	}

	const { cursor, totalCount } = CannedResponse.findPaginated(filter, {
		sort: options.sort || { shortcut: 1 },
		skip: options.offset,
		limit: options.count,
	});
	const [cannedResponses, total] = await Promise.all([cursor.toArray(), totalCount]);
	return {
		cannedResponses: await getTagsInformation(cannedResponses),
		total,
	};
}

export async function findOneCannedResponse({ userId, _id }) {
	if (await hasPermissionAsync(userId, 'view-all-canned-responses')) {
		return CannedResponse.findOneById(_id);
	}

	const departments = await LivechatDepartmentAgents.find(
		{
			agentId: userId,
		},
		{
			fields: {
				departmentId: 1,
			},
		},
	).toArray();

	const monitoredDepartments = await LivechatUnit.findMonitoredDepartmentsByMonitorId(userId);
	const combinedDepartments = [
		...departments.map((department) => department.departmentId),
		...monitoredDepartments.map((department) => department._id),
	];

	const filter = {
		_id,
		$or: [
			{
				scope: 'user',
				userId,
			},
			{
				scope: 'department',
				departmentId: {
					$in: combinedDepartments,
				},
			},
			{
				scope: 'global',
			},
		],
	};

	return CannedResponse.findOne(filter);
}
