import { Template } from 'meteor/templating';
import { roomTypes } from 'meteor/rocketchat:utils';

Template.messagePopupChannel.helpers({
	channelIcon() {
		return roomTypes.getIcon(this);
	},
});
