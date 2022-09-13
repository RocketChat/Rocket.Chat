import { Meteor } from 'meteor/meteor';
import { LivechatCustomField } from '@rocket.chat/models';

import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

Meteor.methods({
	async 'livechat:getCustomFields'() {
		methodDeprecationLogger.warn('livechat:getCustomFields will be deprecated in future versions of Rocket.Chat');
		return LivechatCustomField.find().toArray();
	},
});
