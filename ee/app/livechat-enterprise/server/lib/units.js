import { Meteor } from 'meteor/meteor';

import LivechatUnit from '../../../models/server/models/LivechatUnit';

export function hasUnits() {
	return LivechatUnit.unfilteredFind({ type: 'u' }).count() > 0;
}

export function getUnitsFromUser() {
	if (!hasUnits()) {
		return;
	}

	return Meteor.call('livechat:getUnitsFromUserRoles');
}
