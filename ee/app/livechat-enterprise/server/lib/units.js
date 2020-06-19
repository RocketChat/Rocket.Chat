import { Meteor } from 'meteor/meteor';

import LivechatUnit from '../../../models/server/models/LivechatUnit';

export function hasUnits() {
	return LivechatUnit.unfilteredFind({ type: 'u' }).count() > 0;
}

export function getUnitsFromUser() {
	if (!hasUnits()) {
		return;
	}

	// TODO remove this Meteor.call as this is used undirectly by models
	return Meteor.call('livechat:getUnitsFromUserRoles');
}
