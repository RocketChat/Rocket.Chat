import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './externalSearch.html';
import { APIClient } from '../../../../../utils/client';

const MESSAGES_COUNT = 50;

Template.externalSearch.helpers({
	messages() {
		return Template.instance().externalMessages.get();
	},
	hasMore() {
		const instance = Template.instance();
		const externalMessages = instance.externalMessages.get();
		return instance.total.get() > externalMessages.length;
	},
});

Template.externalSearch.events({
	'click button.pick-message'(event, instance) {
		event.preventDefault();
		$(`#chat-window-${ instance.roomId } .js-input-message`).val(this.msg).focus();
	},
	'click .load-more'(e, t) {
		e.preventDefault();
		e.stopPropagation();
		t.offset.set(t.offset.get() + MESSAGES_COUNT);
	},
	'click .load-more-omnichannel-external-messages'(event, instance) {
		return instance.offset.set(instance.offset.get() + MESSAGES_COUNT);
	},
});

Template.externalSearch.onCreated(function() {
	this.roomId = null;
	this.externalMessages = new ReactiveVar([]);
	this.offset = new ReactiveVar(0);
	this.ready = new ReactiveVar(true);
	this.total = new ReactiveVar(0);

	this.autorun(async () => {
		this.ready.set(false);
		const offset = this.offset.get();
		this.roomId = Template.currentData().rid;
		if (this.roomId) {
			const { messages, total } = await APIClient.v1.get(`livechat/messages.external/${ this.roomId }?count=${ MESSAGES_COUNT }&offset=${ offset }`);
			this.total.set(total);
			if (offset === 0) {
				this.externalMessages.set(messages);
			} else {
				this.externalMessages.set(this.externalMessages.get().concat(messages));
			}
		}
		this.ready.set(true);
	});
});
