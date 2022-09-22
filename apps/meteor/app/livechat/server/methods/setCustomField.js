import { Meteor } from 'meteor/meteor';
import { LivechatVisitors, LivechatCustomField } from '@rocket.chat/models';

import { LivechatRooms } from '../../../models/server';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

Meteor.methods({
	async 'livechat:setCustomField'(token, key, value, overwrite = true) {
		methodDeprecationLogger.warn('livechat:setCustomField will be deprecated in future versions of Rocket.Chat');

		const customField = await LivechatCustomField.findOneById(key);
		if (customField) {
			if (customField.scope === 'room') {
				return LivechatRooms.updateDataByToken(token, key, value, overwrite);
			}
			// Save in user
			return LivechatVisitors.updateLivechatDataByToken(token, key, value, overwrite);
		}

		return true;
	},
});
