import { FilterQuery, SortOptionObject } from 'mongodb';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { PaginatedResult } from '@rocket.chat/rest-typings';
import type { ILivechatDepartmentRecord, ILivechatDepartmentAgents } from '@rocket.chat/core-typings';

import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { LivechatDepartment, LivechatDepartmentAgents } from '../../../../models/server/raw';
import { callbacks } from '../../../../../lib/callbacks';

type Pagination<T> = { pagination: { offset: number; count: number; sort: SortOptionObject<T> } };
type FindDepartmentParams = {
	userId: string;
	onlyMyDepartments?: boolean;
	text?: string;
	enabled?: boolean;
	excludeDepartmentId?: string;
} & Pagination<ILivechatDepartmentRecord>;
type FindDepartmentByIdParams = {
	userId: string;
	departmentId: string;
	includeAgents?: boolean;
	onlyMyDepartments?: boolean;
};
type FindDepartmentToAutocompleteParams = {
	uid: string;
	selector: {
		exceptions: string[];
		conditions: FilterQuery<ILivechatDepartmentRecord>;
		term: string;
	};
	onlyMyDepartments?: boolean;
};
type FindDepartmentAgentsParams = {
	userId: string;
	departmentId: string;
} & Pagination<ILivechatDepartmentAgents>;

export async function findDepartments({
	userId,
	onlyMyDepartments = false,
	text,
	enabled,
	excludeDepartmentId,
	pagination: { offset, count, sort },
}: FindDepartmentParams): Promise<PaginatedResult<{ departments: ILivechatDepartmentRecord[] }>> {
	if (!(await hasPermissionAsync(userId, 'view-livechat-departments')) && !(await hasPermissionAsync(userId, 'view-l-room'))) {
		throw new Error('error-not-authorized');
	}

	let query = {
		$or: [{ type: { $eq: 'd' } }, { type: { $exists: false } }],
		...(enabled && { enabled: Boolean(enabled) }),
		...(text && { name: new RegExp(escapeRegExp(text), 'i') }),
		...(excludeDepartmentId && { _id: { $ne: excludeDepartmentId } }),
	};

	if (onlyMyDepartments) {
		query = callbacks.run('livechat.applyDepartmentRestrictions', query, { userId });
	}

	const cursor = LivechatDepartment.find(query, {
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

export async function findDepartmentById({
	userId,
	departmentId,
	includeAgents = true,
	onlyMyDepartments = false,
}: FindDepartmentByIdParams): Promise<{
	department: ILivechatDepartmentRecord | null;
	agents?: ILivechatDepartmentAgents[];
}> {
	const canViewLivechatDepartments = await hasPermissionAsync(userId, 'view-livechat-departments');
	if (!canViewLivechatDepartments && !(await hasPermissionAsync(userId, 'view-l-room'))) {
		throw new Error('error-not-authorized');
	}

	let query = { _id: departmentId };

	if (onlyMyDepartments) {
		query = callbacks.run('livechat.applyDepartmentRestrictions', query, { userId });
	}

	const result = {
		department: await LivechatDepartment.findOne(query),
		...(includeAgents &&
			canViewLivechatDepartments && {
				agents: await LivechatDepartmentAgents.find({ departmentId }).toArray(),
			}),
	};

	return result;
}

export async function findDepartmentsToAutocomplete({
	uid,
	selector,
	onlyMyDepartments = false,
}: FindDepartmentToAutocompleteParams): Promise<{ items: ILivechatDepartmentRecord[] }> {
	if (!(await hasPermissionAsync(uid, 'view-livechat-departments')) && !(await hasPermissionAsync(uid, 'view-l-room'))) {
		return { items: [] };
	}
	const { exceptions = [] } = selector;
	let { conditions = {} } = selector;

	const options = {
		projection: {
			_id: 1,
			name: 1,
		},
		sort: {
			name: 1,
		},
	};

	if (onlyMyDepartments) {
		conditions = callbacks.run('livechat.applyDepartmentRestrictions', conditions, { userId: uid });
	}

	const items = await LivechatDepartment.findByNameRegexWithExceptionsAndConditions(
		selector.term,
		exceptions,
		conditions,
		options,
	).toArray();
	return {
		items,
	};
}

export async function findDepartmentAgents({
	userId,
	departmentId,
	pagination: { offset, count, sort },
}: FindDepartmentAgentsParams): Promise<PaginatedResult<{ agents: ILivechatDepartmentAgents[] }>> {
	if (!(await hasPermissionAsync(userId, 'view-livechat-departments')) && !(await hasPermissionAsync(userId, 'view-l-room'))) {
		throw new Error('error-not-authorized');
	}

	const cursor = LivechatDepartmentAgents.findAgentsByDepartmentId<ILivechatDepartmentAgents>(departmentId, {
		sort: sort || { username: 1 },
		skip: offset,
		limit: count,
	});

	const total = await cursor.count();

	const agents = await cursor.toArray();

	return {
		agents,
		count: agents.length,
		offset,
		total,
	};
}

export async function findDepartmentsBetweenIds({
	uid,
	ids,
	fields,
}: {
	uid: string;
	ids: string[];
	fields: Record<string, unknown>;
}): Promise<{ departments: ILivechatDepartmentRecord[] }> {
	if (!(await hasPermissionAsync(uid, 'view-livechat-departments')) && !(await hasPermissionAsync(uid, 'view-l-room'))) {
		throw new Error('error-not-authorized');
	}

	const departments = await LivechatDepartment.findInIds(ids, fields).toArray();
	return { departments };
}
