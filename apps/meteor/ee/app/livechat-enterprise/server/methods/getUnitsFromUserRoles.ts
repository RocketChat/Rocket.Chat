import { Meteor } from 'meteor/meteor';
import mem from 'mem';

import { hasAnyRoleAsync } from '../../../../../app/authorization/server/functions/hasRole';
import LivechatUnit from '../../../models/server/models/LivechatUnit';

export async function getUnitsFromUserRoles(user: Meteor.User | null): Promise<{ [k: string]: any }[] | undefined> {
	if (!user || (await hasAnyRoleAsync(user._id, ['admin', 'livechat-manager']))) {
		return;
	}

	return (await hasAnyRoleAsync(user._id, ['livechat-monitor'])) && LivechatUnit.findByMonitorId(user._id);
}

const memoizedGetUnitFromUserRoles = mem(getUnitsFromUserRoles, { maxAge: 5000 });

Meteor.methods({
	'livechat:getUnitsFromUser'(): Promise<{ [k: string]: any }[] | undefined> {
		const user = Meteor.user();
		return memoizedGetUnitFromUserRoles(user);
	},
});
