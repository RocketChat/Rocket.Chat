import { Meteor } from 'meteor/meteor';
import { Rooms, LivechatVisitors, LivechatCustomField } from 'meteor/rocketchat:models';

Meteor.methods({
	'livechat:setCustomField'(token, key, value, overwrite = true) {
		const customField = LivechatCustomField.findOneById(key);
		if (customField) {
			if (customField.scope === 'room') {
				return Rooms.updateLivechatDataByToken(token, key, value, overwrite);
			} else {
				// Save in user
				return LivechatVisitors.updateLivechatDataByToken(token, key, value, overwrite);
			}
		}

		return true;
	},
});
