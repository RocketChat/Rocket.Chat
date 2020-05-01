import moment from 'moment';
import './customerChatHistoryMessagesItem.html';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

Template.customerChatHistoryMessagesItem.helpers({
	time() {
		const { closedAt } = Template.instance().room.get();
		return moment(closedAt).format('LT');
	},
});

Template.customerChatHistoryMessagesItem.onCreated(function() {
	this.room = new ReactiveVar();
	this.autorun(() => {
		this.room.set(Template.currentData());
	});
});
