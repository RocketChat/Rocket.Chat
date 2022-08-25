import type { Filter, FindOptions } from 'mongodb';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { PaginatedResult } from '@rocket.chat/rest-typings';
import type { ILivechatDepartmentRecord, ILivechatDepartmentAgents } from '@rocket.chat/core-typings';
import { LivechatDepartment, LivechatDepartmentAgents } from '@rocket.chat/models';

import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { callbacks } from '../../../../../lib/callbacks';

type Pagination<T> = { pagination: { offset: number; count: number; sort: FindOptions<T>['sort'] } };
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
		conditions: Filter<ILivechatDepartmentRecord>;
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
	let query = {
		$or: [{ type: { $eq: 'd' } }, { type: { $exists: false } }],
		...(enabled && { enabled: Boolean(enabled) }),
		...(text && { name: new RegExp(escapeRegExp(text), 'i') }),
		...(excludeDepartmentId && { _id: { $ne: excludeDepartmentId } }),
	};

	if (onlyMyDepartments) {
		query = callbacks.run('livechat.applyDepartmentRestrictions', query, { userId });
	}

	const { cursor, totalCount } = LivechatDepartment.findPaginated(query, {
		sort: sort || { name: 1 },
		skip: offset,
		limit: count,
	});

	const [departments, total] = await Promise.all([cursor.toArray(), totalCount]);

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
	const canViewLivechatDepartments = includeAgents && (await hasPermissionAsync(userId, 'view-livechat-departments'));

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
	const { exceptions = [] } = selector;
	let { conditions = {} } = selector;

	if (onlyMyDepartments) {
		conditions = callbacks.run('livechat.applyDepartmentRestrictions', conditions, { userId: uid });
	}

	const items = await LivechatDepartment.findByNameRegexWithExceptionsAndConditions(selector.term, exceptions, conditions, {
		projection: {
			_id: 1,
			name: 1,
		},
		sort: {
			name: 1,
		},
	}).toArray();
	return {
		items,
	};
}

export async function findDepartmentAgents({
	departmentId,
	pagination: { offset, count, sort },
}: FindDepartmentAgentsParams): Promise<PaginatedResult<{ agents: ILivechatDepartmentAgents[] }>> {
	const { cursor, totalCount } = LivechatDepartmentAgents.findAgentsByDepartmentId<ILivechatDepartmentAgents>(departmentId, {
		sort: sort || { username: 1 },
		skip: offset,
		limit: count,
	});

	const [agents, total] = await Promise.all([cursor.toArray(), totalCount]);

	return {
		agents,
		count: agents.length,
		offset,
		total,
	};
}

export async function findDepartmentsBetweenIds({
	ids,
	fields,
}: {
	ids: string[];
	fields: Record<string, unknown>;
}): Promise<{ departments: ILivechatDepartmentRecord[] }> {
	const departments = await LivechatDepartment.findInIds(ids, fields).toArray();
	return { departments };
}
