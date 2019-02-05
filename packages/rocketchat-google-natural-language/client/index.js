import { Template } from 'meteor/templating';
import { RocketChat } from 'meteor/rocketchat:lib';
import { ChatRoom } from 'meteor/rocketchat:ui';

Template.room.helpers({
	sentimentSmile() {
		if (!RocketChat.settings.get('GoogleNaturalLanguage_Enabled')) {
			return;
		}

		const room = ChatRoom.findOne(this._id, { fields: { sentiment: 1 } });

		if (room.sentiment >= 0.3) {
			return ':)';
		} else if (room.sentiment >= -0.3) {
			return ':|';
		} else if (room.sentiment < -0.3) {
			return ':(';
		}
	},
});
