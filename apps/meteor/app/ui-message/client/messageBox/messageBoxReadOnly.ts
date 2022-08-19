import { Template } from 'meteor/templating';

import { roomCoordinator } from '../../../../client/lib/rooms/roomCoordinator';
import './messageBoxReadOnly.html';

Template.messageBoxReadOnly.helpers({
	customTemplate() {
		return roomCoordinator.getRoomTypeConfigById(this.rid)?.readOnlyTpl ?? false;
	},
});
