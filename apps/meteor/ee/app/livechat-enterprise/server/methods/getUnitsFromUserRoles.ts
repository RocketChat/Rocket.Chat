import { Meteor } from 'meteor/meteor';

import { hasAnyRoleAsync } from '../../../../../app/authorization/server/functions/hasRole';
import LivechatUnit from '../../../models/server/models/LivechatUnit';

Meteor.methods({
	async 'livechat:getUnitsFromUserRoles'() {
		const user = Meteor.user();
		if (!user || (await hasAnyRoleAsync(user._id, ['admin', 'livechat-manager']))) {
			return;
		}

		return (await hasAnyRoleAsync(user._id, ['livechat-monitor'])) && LivechatUnit.findByMonitorId(user._id);
	},
});
