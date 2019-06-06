import { Template } from 'meteor/templating';
import { roomTypes } from '../../../utils';
import './messagePopupChannel.html';

Template.messagePopupChannel.helpers({
	channelIcon() {
		return roomTypes.getIcon(this);
	},
});
