import { escapeRegExp } from '@rocket.chat/string-helpers';

import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { LivechatDepartment, LivechatDepartmentAgents } from '../../../../models/server/raw';
import { callbacks } from '../../../../callbacks/server';


export async function findDepartments({ userId, onlyMyDepartments = false, text, enabled, pagination: { offset, count, sort } }) {
	if (!await hasPermissionAsync(userId, 'view-livechat-departments') && !await hasPermissionAsync(userId, 'view-l-room')) {
		throw new Error('error-not-authorized');
	}

	let query = {
		$or: [
			{ type: { $eq: 'd' } },
			{ type: { $exists: false } },
		],
		...enabled && { enabled: Boolean(enabled) },
		...text && { name: new RegExp(escapeRegExp(text), 'i') },
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

export async function findDepartmentById({ userId, departmentId, includeAgents = true, onlyMyDepartments = false }) {
	const canViewLivechatDepartments = await hasPermissionAsync(userId, 'view-livechat-departments');
	if (!canViewLivechatDepartments && !await hasPermissionAsync(userId, 'view-l-room')) {
		throw new Error('error-not-authorized');
	}

	let query = { _id: departmentId };

	if (onlyMyDepartments) {
		query = callbacks.run('livechat.applyDepartmentRestrictions', query, { userId });
	}

	const result = {
		department: await LivechatDepartment.findOne(query),
	};
	if (includeAgents && canViewLivechatDepartments) {
		result.agents = await LivechatDepartmentAgents.find({ departmentId }).toArray();
	}

	return result;
}

export async function findDepartmentsToAutocomplete({ uid, selector, onlyMyDepartments = false }) {
	if (!await hasPermissionAsync(uid, 'view-livechat-departments') && !await hasPermissionAsync(uid, 'view-l-room')) {
		return { items: [] };
	}
	const { exceptions = [] } = selector;
	let { conditions = {} } = selector;

	const options = {
		fields: {
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

	const items = await LivechatDepartment.findByNameRegexWithExceptionsAndConditions(selector.term, exceptions, conditions, options).toArray();
	return {
		items,
	};
}

export async function findDepartmentAgents({ userId, departmentId, pagination: { offset, count, sort } }) {
	if (!await hasPermissionAsync(userId, 'view-livechat-departments') && !await hasPermissionAsync(userId, 'view-l-room')) {
		throw new Error('error-not-authorized');
	}

	const cursor = LivechatDepartmentAgents.findAgentsByDepartmentId(departmentId, {
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

export async function findDepartmentsBetweenIds({ uid, ids, fields }) {
	if (!await hasPermissionAsync(uid, 'view-livechat-departments') && !await hasPermissionAsync(uid, 'view-l-room')) {
		throw new Error('error-not-authorized');
	}

	const departments = await LivechatDepartment.findInIds(ids, fields).toArray();
	return { departments };
}
