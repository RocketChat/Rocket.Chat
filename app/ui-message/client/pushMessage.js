import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { timeAgo } from '../../lib/client/lib/formatDate';
import './pushMessage.html';

Template.pushMessage.helpers({
	data() {
		const { _id, pushm_post_processed, pushm_scope, pushm_origin, msg, post_processed_message } = this.msg;

		if (!pushm_post_processed) {
			navigator.serviceWorker.ready.then((serviceWorkerRegistration) => {
				console.log('Pushing message to service worker for post processing');
				const promise = serviceWorkerRegistration.monitorNotification(pushm_origin);
				serviceWorkerRegistration.pushManager.dispatchMessage(pushm_scope, msg);
				promise.then((post_processed_message) => {
					const newMsg = {};
					console.log(post_processed_message);
					newMsg.title = post_processed_message.title;
					newMsg.body = post_processed_message.body;
					newMsg.icon = post_processed_message.icon;
					newMsg.actions = post_processed_message.actions;
					newMsg.timestamp = post_processed_message.timestamp;
					Meteor.call('savePostProcessedMessage', _id, newMsg);
				});
			});
		} else {
			return post_processed_message;
		}
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
