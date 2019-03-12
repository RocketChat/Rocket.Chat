import { Template } from 'meteor/templating';
import { roomTypes } from '/app/utils';

Template.messagePopupChannel.helpers({
	channelIcon() {
		return roomTypes.getIcon(this);
	},
});
