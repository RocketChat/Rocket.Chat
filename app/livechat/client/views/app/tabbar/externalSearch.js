import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './externalSearch.html';
import { APIClient } from '../../../../../utils/client';

Template.externalSearch.helpers({
	messages() {
		return Template.instance().externalMessages.get();
	},
});

Template.externalSearch.events({
	'click button.pick-message'(event, instance) {
		event.preventDefault();

		$(`#chat-window-${instance.roomId} .input-message`).val(this.msg).focus();
	},
});

Template.externalSearch.onCreated(function () {
	this.roomId = null;
	this.externalMessages = new ReactiveVar([]);

	this.autorun(async () => {
		this.roomId = Template.currentData().rid;
		if (this.roomId) {
			const { messages } = await APIClient.v1.get(`livechat/messages.external?roomId=${this.roomId}`);
			this.externalMessages.set(messages);
		}
	});
});
