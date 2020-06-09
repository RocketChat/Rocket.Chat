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
		console.log(data);
		return data;
	},
	timeAgo(date) {
		return timeAgo(date);
	},
});

Template.pushMessage.events({
	'click .collapse': (e) => {
		$(e.delegateTarget).find('.button-down').removeClass('collapse').addClass('expand');
		$(e.delegateTarget).find('.push-message-body').removeClass('body-collapsed');
	},

	'click .expand': (e) => {
		$(e.delegateTarget).find('.button-down').removeClass('expand').addClass('collapse');
		$(e.delegateTarget).find('.push-message-body').addClass('body-collapsed');
	},
});
