import moment from 'moment';
import './chatRoomHistoryItem.html';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

Template.chatRoomHistoryItem.helpers({
	closedAt() {
		const { closedAt } = Template.instance().room.get();
		return moment(closedAt).format('LT');
	},
	hasClosingRoomMessage() {
		const { lastMessage } = Template.instance().room.get();
		if (lastMessage.t === 'livechat-close') {
			Template.instance().closingRoomMessage.set(lastMessage);
			return true;
		}
		return false;
	},
	closingRoomMessage() {
		const closingObj = Template.instance().closingRoomMessage.get();
		return closingObj.msg;
	},
});

Template.chatRoomHistoryItem.onCreated(function() {
	this.room = new ReactiveVar();
	this.closingRoomMessage = new ReactiveVar();
	this.autorun(() => {
		this.room.set(Template.currentData());
	});
});
