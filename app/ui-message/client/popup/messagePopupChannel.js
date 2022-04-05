import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import './messagePopupChannel.html';
import { roomCoordinator } from '../../../../client/lib/rooms/roomCoordinator';

Template.messagePopupChannel.helpers({
	channelIcon() {
		return roomCoordinator.getIcon(this);
	},
	roomIcon() {
		const room = roomTypes.findRoom('p', this.topic, Meteor.userId());
		return roomTypes.getIcon(room);
	},
});
