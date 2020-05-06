import moment from 'moment';
import './customerChatHistoryMessagesItem.html';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

Template.customerChatHistoryMessagesItem.helpers({
	time() {
		const { closedAt } = Template.instance().room.get();
		return moment(closedAt).format('LT');
	},
	hasClosingMessage() {
		return Template.instance().hasClosingMessage.get();
	},
});

Template.customerChatHistoryMessagesItem.onCreated(function() {
	this.room = new ReactiveVar();
	this.hasClosingMessage = new ReactiveVar(false);
	const currentData = Template.currentData();
	this.autorun(() => {
		this.room.set(Template.currentData());
		if (currentData.t === 'livechat-close') {
			this.hasClosingMessage.set(true);
		}
	});
});
