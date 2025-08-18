import { Authorization } from '@rocket.chat/core-services';
import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import { LivechatUnit, LivechatDepartmentAgents } from '@rocket.chat/models';
import mem from 'mem';
import type { FilterOperators } from 'mongodb';

import { defaultLogger } from '../utils/logger';

export const addQueryRestrictionsToDepartmentsModel = async (originalQuery: FilterOperators<ILivechatDepartment> = {}, userId: string) => {
	const query: FilterOperators<ILivechatDepartment> = { ...originalQuery, type: { $ne: 'u' } };

	const units = await getUnitsFromUser(userId);
	if (Array.isArray(units)) {
		query.ancestors = { $in: units };
	}

	defaultLogger.debug({ msg: 'Applying department query restrictions', userId, units });
	return query;
};

async function getUnitsFromUserRoles(user: string): Promise<string[]> {
	return LivechatUnit.findByMonitorId(user);
}

async function getDepartmentsFromUserRoles(user: string): Promise<string[]> {
	return (await LivechatDepartmentAgents.findByAgentId(user).toArray()).map((department) => department.departmentId);
}

const memoizedGetUnitFromUserRoles = mem(getUnitsFromUserRoles, { maxAge: process.env.TEST_MODE ? 1 : 10000 });
const memoizedGetDepartmentsFromUserRoles = mem(getDepartmentsFromUserRoles, { maxAge: process.env.TEST_MODE ? 1 : 10000 });

async function hasUnits(): Promise<boolean> {
	// @ts-expect-error - this prop is injected dynamically on ee license
	return (await LivechatUnit.countUnits({ type: 'u' })) > 0;
}

// Units should't change really often, so we can cache the result
const memoizedHasUnits = mem(hasUnits, { maxAge: process.env.TEST_MODE ? 1 : 10000 });

export const getUnitsFromUser = async (userId?: string): Promise<string[] | undefined> => {
	if (!userId) {
		return;
	}

	if (!(await memoizedHasUnits())) {
		return;
	}

	// TODO: we can combine these 2 calls into one single query
	if (await Authorization.hasAnyRole(userId, ['admin', 'livechat-manager'])) {
		return;
	}

	if (!(await Authorization.hasAnyRole(userId, ['livechat-monitor']))) {
		return;
	}

	const unitsAndDepartments = [...(await memoizedGetUnitFromUserRoles(userId)), ...(await memoizedGetDepartmentsFromUserRoles(userId))];
	defaultLogger.debug({ msg: 'Calculating units for monitor', user: userId, unitsAndDepartments });

	return unitsAndDepartments;
};
