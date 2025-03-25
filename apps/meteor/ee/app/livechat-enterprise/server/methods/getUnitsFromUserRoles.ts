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

const memoizedGetUnitFromUserRoles = mem(getUnitsFromUserRoles, { maxAge: process.env.TEST_MODE ? 1 : 10000 });
const memoizedGetDepartmentsFromUserRoles = mem(getDepartmentsFromUserRoles, { maxAge: process.env.TEST_MODE ? 1 : 10000 });

export const getUnitsFromUser = async (user: string): Promise<string[] | undefined> => {
	// TODO: we can combine these 2 calls into one single query
	if (!user || (await hasAnyRoleAsync(user, ['admin', 'livechat-manager']))) {
		return;
	}

	if (!(await hasAnyRoleAsync(user, ['livechat-monitor']))) {
		return;
	}

	const unitsAndDepartments = [...(await memoizedGetUnitFromUserRoles(user)), ...(await memoizedGetDepartmentsFromUserRoles(user))];
	logger.debug({ msg: 'Calculating units for monitor', user, unitsAndDepartments });

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
		methodDeprecationLogger.method('livechat:getUnitsFromUser', '8.0.0');
		const user = Meteor.userId();
		if (!user) {
			return;
		}
		return getUnitsFromUser(user);
	},
});
