import './contactChatHistoryItem.html';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import { getDate, getDateWithFormat } from '../../../../../../lib/rocketchat-dates';

Template.contactChatHistoryItem.helpers({
	closedAt() {
		const { closedAt } = Template.instance().room.get();
		return getDateWithFormat(getDate(closedAt), 'lll');
	},
	closingRoomMessage() {
		const closingObj = Template.instance().closingRoomMessage.get();
		return closingObj.msg;
	},
	i18nMessageCounter() {
		const { msgs } = this;
		return `<span class='message-counter'>${ msgs }</span>`;
	},
});

Template.contactChatHistoryItem.onCreated(function() {
	this.room = new ReactiveVar();

	this.autorun(async () => {
		const currentData = Template.currentData();
		this.room.set(currentData);
	});
});
