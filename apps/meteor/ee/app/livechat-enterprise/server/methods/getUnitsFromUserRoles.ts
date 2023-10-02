import { Meteor } from 'meteor/meteor';
import mem from 'mem';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { LivechatUnit, LivechatDepartmentAgents } from '@rocket.chat/models';

import { hasAnyRoleAsync } from '../../../../../app/authorization/server/functions/hasRole';

async function getUnitsFromUserRoles(user: string | null): Promise<string[] | undefined> {
	if (!user || (await hasAnyRoleAsync(user, ['admin', 'livechat-manager']))) {
		return;
	}

	if (!(await hasAnyRoleAsync(user, ['livechat-monitor']))) {
		return;
	}

	return LivechatUnit.findByMonitorId(user);
}

async function getDepartmentsFromUserRoles(user: string | null): Promise<string[] | undefined> {
	if (!user || (await hasAnyRoleAsync(user, ['admin', 'livechat-manager']))) {
		return;
	}

	if (!(await hasAnyRoleAsync(user, ['livechat-monitor']))) {
		return;
	}

	return (await LivechatDepartmentAgents.findByAgentId(user).toArray()).map((department) => department.departmentId);
}

const memoizedGetUnitFromUserRoles = mem(getUnitsFromUserRoles, { maxAge: 10000 });
const memoizedGetDepartmentsFromUserRoles = mem(getDepartmentsFromUserRoles, { maxAge: 5000 });

export const getUnitsFromUser = async (user: string | null) => {
	const units = await memoizedGetUnitFromUserRoles(user);
	if (!units?.length) {
		return;
	}

	const departments = (await memoizedGetDepartmentsFromUserRoles(user)) || [];
	return [...units, ...departments];
};

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:getUnitsFromUser'(): Promise<string[] | undefined>;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:getUnitsFromUser'(): Promise<string[] | undefined> {
		const user = Meteor.userId();

		return getUnitsFromUser(user);
	},
});
