import { Template } from 'meteor/templating';

import './messageBoxReadOnly.html';
import { roomCoordinator } from '../../../../client/lib/rooms/roomCoordinator';

Template.messageBoxReadOnly.helpers({
	customTemplate() {
		return roomCoordinator.getRoomTypeConfigById(this.rid).readOnlyTpl;
	},
});
