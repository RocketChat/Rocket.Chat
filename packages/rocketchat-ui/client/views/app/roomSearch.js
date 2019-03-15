import { Template } from 'meteor/templating';
import { roomTypes } from 'meteor/rocketchat:utils';

Template.roomSearch.helpers({
	roomIcon() {
		if (this.type === 'u') {
			return 'icon-at';
		}
		if (this.type === 'r') {
			return roomTypes.getIcon(this);
		}
	},
	userStatus() {
		if (this.type === 'u') {
			return `status-${ this.status }`;
		}
	},
});
