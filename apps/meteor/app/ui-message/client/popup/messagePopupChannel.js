import { Template } from 'meteor/templating';

import './messagePopupChannel.html';
import { roomCoordinator } from '../../../../client/lib/rooms/roomCoordinator';

Template.messagePopupChannel.helpers({
	channelIcon() {
		return roomCoordinator.getIcon(this);
	},
});
