import { Template } from 'meteor/templating';

import { roomTypes } from '../../../utils';
import './messagePopupUser.html';

Template.messagePopupUser.helpers({
	teamIcon() {
		return roomTypes.getIcon(this);
	},
});
