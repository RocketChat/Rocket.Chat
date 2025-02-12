import type { ILivechatAgent, IRole } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { FilterOperators } from 'mongodb';

/**
 * @param {IRole['_id']} role the role id
 * @param {string} text
 * @param {any} pagination
 */
async function findUsers({
	role,
	text,
	onlyAvailable = false,
	excludeId,
	showIdleAgents = true,
	pagination: { offset, count, sort },
}: {
	role: IRole['_id'];
	text?: string;
	onlyAvailable?: boolean;
	excludeId?: string;
	showIdleAgents?: boolean;
	pagination: { offset: number; count: number; sort: any };
}): Promise<{ users: ILivechatAgent[]; count: number; offset: number; total: number }> {
	const query: FilterOperators<ILivechatAgent> = {};
	const orConditions: FilterOperators<ILivechatAgent>['$or'] = [];
	if (text) {
		const filterReg = new RegExp(escapeRegExp(text), 'i');
		orConditions.push({ $or: [{ username: filterReg }, { name: filterReg }, { 'emails.address': filterReg }] });
	}

	if (onlyAvailable) {
		query.statusLivechat = 'available';
	}

	if (excludeId) {
		query._id = { $ne: excludeId };
	}

	if (!showIdleAgents) {
		orConditions.push({ $or: [{ status: { $exists: true, $ne: 'offline' }, roles: { $ne: 'bot' } }, { roles: 'bot' }] });
	}

	if (orConditions.length) {
		query.$and = orConditions;
	}

	const [
		{
			sortedResults,
			totalCount: [{ total } = { total: 0 }],
		},
	] = await Users.findAgentsWithDepartments(role, query, {
		sort: sort || { name: 1 },
		skip: offset,
		limit: count,
		projection: {
			username: 1,
			name: 1,
			status: 1,
			statusLivechat: 1,
			emails: 1,
			livechat: 1,
		},
	});

	return {
		users: sortedResults,
		count: sortedResults.length,
		offset,
		total,
	};
}
export async function findAgents({
	text,
	onlyAvailable = false,
	excludeId,
	showIdleAgents = true,
	pagination: { offset, count, sort },
}: {
	text?: string;
	onlyAvailable: boolean;
	excludeId?: string;
	showIdleAgents?: boolean;
	pagination: { offset: number; count: number; sort: any };
}): Promise<ReturnType<typeof findUsers>> {
	return findUsers({
		role: 'livechat-agent',
		text,
		onlyAvailable,
		excludeId,
		showIdleAgents,
		pagination: {
			offset,
			count,
			sort,
		},
	});
}

export async function findManagers({
	text,
	pagination: { offset, count, sort },
}: {
	text?: string;
	pagination: { offset: number; count: number; sort: any };
}): Promise<ReturnType<typeof findUsers>> {
	return findUsers({
		role: 'livechat-manager',
		text,
		pagination: {
			offset,
			count,
			sort,
		},
	});
}
