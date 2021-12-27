import { escapeRegExp } from '@rocket.chat/string-helpers';
import { FindOneOptions } from 'mongodb';

import { hasPermissionAsync } from '../../../../../app/authorization/server/functions/hasPermission';
import CannedResponse from '../../../models/server/raw/CannedResponse';
import LivechatUnit from '../../../models/server/models/LivechatUnit';
import { LivechatDepartmentAgents } from '../../../../../app/models/server/raw';
import { IOmnichannelCannedResponse } from '../../../../../definition/IOmnichannelCannedResponse';

export async function findAllCannedResponses({ userId }: { userId: string }): Promise<IOmnichannelCannedResponse[]> {
	if (!await hasPermissionAsync(userId, 'view-canned-responses')) {
		throw new Error('error-not-authorized');
	}

	// If the user is an admin or livechat manager, get his own responses and all responses from all departments
	if (await hasPermissionAsync(userId, 'view-all-canned-responses')) {
		return CannedResponse.find({
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
	}

	// If the user it not any of the previous roles nor an agent, then get only his own responses
	if (!await hasPermissionAsync(userId, 'view-agent-canned-responses')) {
		return CannedResponse.find({
			scope: 'user',
			userId,
		}).toArray();
	}

	// Last scenario: user is an agente, so get his own responses and those from the departments he is in
	const departments = await LivechatDepartmentAgents.find({
		agentId: userId,
	}, {
		projection: {
			departmentId: 1,
		},
	}).toArray();

	const monitoredDepartments = LivechatUnit.findMonitoredDepartmentsByMonitorId(userId).fetch();
	const combinedDepartments = [
		...departments.map((department) => department.departmentId),
		...monitoredDepartments.map((department: any) => department._id),
	];

	return CannedResponse.find({
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
}

type FindAllFilteredParams = { userId?: string; shortcut?: string; text?: string; departmentId?: string; scope?: string; createdBy?: string; tags?: string[]; options?: FindOneOptions<IOmnichannelCannedResponse> & { count: number; offset: number } };
export async function findAllCannedResponsesFilter({ userId, shortcut, text, departmentId, scope, createdBy, tags = [], options }: FindAllFilteredParams): Promise<{ cannedResponses: IOmnichannelCannedResponse[]; total: number }> {
	if (!await hasPermissionAsync(userId, 'view-canned-responses')) {
		throw new Error('error-not-authorized');
	}

	let extraFilter: any[] = [];
	// if user cannot see all, filter to private + public + departments user is in
	if (!await hasPermissionAsync(userId, 'view-all-canned-responses')) {
		const departments = await LivechatDepartmentAgents.find({
			agentId: userId,
		}, {
			projection: {
				departmentId: 1,
			},
		}).toArray();

		const monitoredDepartments = LivechatUnit.findMonitoredDepartmentsByMonitorId(userId).toArray();
		const combinedDepartments = [
			...departments.map((department) => department.departmentId),
			...monitoredDepartments.map((department: any) => department._id),
		];

		const isDepartmentInScope = (departmentId: string): boolean => !!combinedDepartments.includes(departmentId);

		const departmentIds = departmentId && isDepartmentInScope(departmentId)
			? [departmentId]
			: combinedDepartments;

		extraFilter = [{
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
		}];
	}

	if (departmentId) {
		extraFilter = [{
			departmentId,
		}];
	}

	const textFilter = new RegExp(escapeRegExp(text || ''), 'i');

	let filter: { $and?: object[] } = {
		$and: [
			...shortcut ? [{ shortcut }] : [],
			...text ? [{ $or: [{ shortcut: textFilter }, { text: textFilter }] }] : [],
			...scope ? [{ scope }] : [],
			...createdBy ? [{ 'createdBy._id': createdBy }] : [],
			...tags.length ? [{
				tags: {
					$in: tags,
				},
			}] : [],
			...extraFilter,
		],
	};

	if (!filter?.$and?.length) {
		filter = {};
	}

	const cursor = CannedResponse.find(filter, {
		sort: options?.sort || { shortcut: 1 },
		skip: options?.offset,
		limit: options?.count,
	});
	const total = await cursor.count();
	const cannedResponses = await cursor.toArray();
	return {
		cannedResponses,
		total,
	};
}

export async function findOneCannedResponse({ userId, _id }: { userId: string; _id: string }): Promise<IOmnichannelCannedResponse | null> {
	if (!await hasPermissionAsync(userId, 'view-canned-responses')) {
		throw new Error('error-not-authorized');
	}

	if (await hasPermissionAsync(userId, 'view-all-canned-responses')) {
		return CannedResponse.findOneById(_id);
	}

	const departments = await LivechatDepartmentAgents.find({
		agentId: userId,
	}, {
		projection: {
			departmentId: 1,
		},
	}).toArray();

	const monitoredDepartments = LivechatUnit.findMonitoredDepartmentsByMonitorId(userId).fetch();
	const combinedDepartments = [
		...departments.map((department) => department.departmentId),
		...monitoredDepartments.map((department: any) => department._id),
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
