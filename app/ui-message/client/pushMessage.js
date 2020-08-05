import { Template } from 'meteor/templating';

import { timeAgo } from '../../lib/client/lib/formatDate';
import './pushMessage.html';

Template.pushMessage.helpers({
	data() {
		const { title, options } = this.msg.pushMessage;
		const data = {
			title,
			...options,
		};
		return data;
	},
	timeAgo(date) {
		return timeAgo(date);
	},
});

Template.pushMessage.events({
	'click .button-collapse': (e) => {
		$(e.delegateTarget).find('.button-down').removeClass('button-collapse').addClass('button-expand');
		$(e.delegateTarget).find('.push-message-body').removeClass('body-collapsed');
	},

	'click .button-expand': (e) => {
		$(e.delegateTarget).find('.button-down').removeClass('button-expand').addClass('button-collapse');
		$(e.delegateTarget).find('.push-message-body').addClass('body-collapsed');
	},
});
