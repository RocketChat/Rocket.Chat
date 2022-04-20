import { Meteor } from 'meteor/meteor';
import mem from 'mem';

import { hasAnyRoleAsync } from '../../../../../app/authorization/server/functions/hasRole';
import LivechatUnit from '../../../models/server/models/LivechatUnit';

export async function getUnitsFromUserRoles(user: string | null): Promise<{ [k: string]: any }[] | undefined> {
	if (!user || (await hasAnyRoleAsync(user, ['admin', 'livechat-manager']))) {
		return;
	}

	return (await hasAnyRoleAsync(user, ['livechat-monitor'])) && LivechatUnit.findByMonitorId(user);
}

const memoizedGetUnitFromUserRoles = mem(getUnitsFromUserRoles, { maxAge: 5000 });

Meteor.methods({
	'livechat:getUnitsFromUser'(): Promise<{ [k: string]: any }[] | undefined> {
		const user = Meteor.userId();
		return memoizedGetUnitFromUserRoles(user);
	},
});
