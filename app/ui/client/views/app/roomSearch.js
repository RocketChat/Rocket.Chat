import { Template } from 'meteor/templating';

import { roomCoordinator } from '../../../../../client/lib/rooms/roomCoordinator';

Template.roomSearch.helpers({
	roomIcon() {
		if (this.type === 'u') {
			return 'icon-at';
		}
		if (this.type === 'r') {
			return roomCoordinator.getIcon(this);
		}
	},
	userStatus() {
		if (this.type === 'u') {
			return `status-${this.status}`;
		}
	},
});
