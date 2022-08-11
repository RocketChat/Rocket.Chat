import { Meteor } from 'meteor/meteor';
import mem from 'mem';
import { LivechatUnit } from '@rocket.chat/models';

import { hasAnyRoleAsync } from '../../../../../app/authorization/server/functions/hasRole';

export async function getUnitsFromUserRoles(user: string | null): Promise<string[] | undefined> {
	if (!user || (await hasAnyRoleAsync(user, ['admin', 'livechat-manager']))) {
		return;
	}

	if (!(await hasAnyRoleAsync(user, ['livechat-monitor']))) {
		return;
	}

	return LivechatUnit.findByMonitorId(user);
}

const memoizedGetUnitFromUserRoles = mem(getUnitsFromUserRoles, { maxAge: 5000 });

Meteor.methods({
	'livechat:getUnitsFromUser'(): Promise<string[] | undefined> {
		const user = Meteor.userId();
		return memoizedGetUnitFromUserRoles(user);
	},
});
