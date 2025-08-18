import type { ServerMethods } from '@rocket.chat/ddp-client';
import { LivechatUnit, LivechatDepartmentAgents } from '@rocket.chat/models';
import mem from 'mem';
import { Meteor } from 'meteor/meteor';

import { hasAnyRoleAsync } from '../../../../../app/authorization/server/functions/hasRole';
import { methodDeprecationLogger } from '../../../../../app/lib/server/lib/deprecationWarningLogger';
import { logger } from '../lib/logger';

async function getUnitsFromUserRoles(user: string): Promise<string[]> {
	return LivechatUnit.findByMonitorId(user);
}

async function getDepartmentsFromUserRoles(user: string): Promise<string[]> {
	return (await LivechatDepartmentAgents.findByAgentId(user).toArray()).map((department) => department.departmentId);
}

export const memoizedGetUnitFromUserRoles = mem(getUnitsFromUserRoles, { maxAge: process.env.TEST_MODE ? 1 : 10000 });
export const memoizedGetDepartmentsFromUserRoles = mem(getDepartmentsFromUserRoles, { maxAge: process.env.TEST_MODE ? 1 : 10000 });

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
	if (await hasAnyRoleAsync(userId, ['admin', 'livechat-manager'])) {
		return;
	}

	if (!(await hasAnyRoleAsync(userId, ['livechat-monitor']))) {
		return;
	}

	const unitsAndDepartments = [...(await memoizedGetUnitFromUserRoles(userId)), ...(await memoizedGetDepartmentsFromUserRoles(userId))];
	logger.debug({ msg: 'Calculating units for monitor', user: userId, unitsAndDepartments });

	return unitsAndDepartments;
};

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:getUnitsFromUser'(): Promise<string[] | undefined>;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:getUnitsFromUser'(): Promise<string[] | undefined> {
		methodDeprecationLogger.method('livechat:getUnitsFromUser', '8.0.0', 'This functionality is no longer supported');
		const userId = Meteor.userId();
		if (!userId) {
			return;
		}
		return getUnitsFromUser(userId);
	},
});
