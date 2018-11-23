import { Template } from 'meteor/templating';

Template.messagePopupChannel.helpers({
	channelIcon() {
		return RocketChat.roomTypes.getIcon(this.t);
	},
});
