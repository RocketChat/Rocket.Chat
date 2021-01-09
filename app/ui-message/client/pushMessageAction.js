import { Template } from 'meteor/templating';

import './pushMessageAction.html';

Template.pushMessage.helpers({
});

Template.pushMessage.events({
	'click .push-message-action-button'(event) {
		alert(this.action);
		event.stopPropagation();
		event.preventDefault();
	},
});
