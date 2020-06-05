import { Template } from 'meteor/templating';

import './pushMessageAction.html';

Template.pushMessage.helpers({
});

Template.pushMessage.events({
	'click .action-button'(event) {
		alert(this.action);
		event.stopPropagation();
		event.preventDefault();
	},
});
