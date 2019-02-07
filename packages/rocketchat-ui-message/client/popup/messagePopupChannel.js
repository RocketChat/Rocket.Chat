import { Template } from 'meteor/templating';
import { RocketChat } from 'meteor/rocketchat:lib';

Template.messagePopupChannel.helpers({
	channelIcon() {
		return RocketChat.roomTypes.getIcon(this.t);
	},
});
