import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { roomTypes } from '../../../utils';
import './messagePopupChannel.html';

Template.messagePopupChannel.helpers({
	channelIcon() {
		return roomTypes.getIcon(this);
	},
	roomIcon() {
		const room = roomTypes.findRoom('p', this.topic, Meteor.userId());
		return roomTypes.getIcon(room);
	},
});
