import { Template } from 'meteor/templating';
import { settings } from 'meteor/rocketchat:settings';
import { ChatRoom } from 'meteor/rocketchat:models';

Template.room.helpers({
	sentimentSmile() {
		if (!settings.get('GoogleNaturalLanguage_Enabled')) {
			return;
		}

		const room = ChatRoom.findOne(this._id, { fields: { sentiment: 1 } });

		if (room.sentiment >= 0.3) {
			return ':)';
		}
		if (room.sentiment >= -0.3) {
			return ':|';
		}
		if (room.sentiment < -0.3) {
			return ':(';
		}
	},
});
