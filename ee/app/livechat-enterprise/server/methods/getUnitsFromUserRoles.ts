import { Meteor } from 'meteor/meteor';

import { hasRolesAsync } from '../../../../../app/authorization/server/functions/hasRole';
import LivechatUnit from '../../../models/server/models/LivechatUnit';

Meteor.methods({
	async 'livechat:getUnitsFromUserRoles'() {
		const user = Meteor.user();
		if (!user || await hasRolesAsync(user._id, ['admin', 'livechat-manager'])) {
			return;
		}

		return await hasRolesAsync(user._id, ['livechat-monitor']) && LivechatUnit.findByMonitorId(user._id);
	},
});
