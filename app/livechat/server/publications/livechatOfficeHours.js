import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { LivechatOfficeHour } from '../../../models';

console.warn('The publication "livechat:officeHour" is deprecated and will be removed after version v3.0.0');
Meteor.publish('livechat:officeHour', function() {
	if (!hasPermission(this.userId, 'view-l-room')) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:officeHour' }));
	}

	return LivechatOfficeHour.find();
});
