import { Template } from 'meteor/templating';
import { roomTypes } from '../../../utils';

Template.messagePopupChannel.helpers({
	channelIcon() {
		return roomTypes.getIcon(this);
	},
});
