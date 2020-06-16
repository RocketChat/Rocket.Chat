import moment from 'moment';
import './contactChatHistoryItem.html';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

// import { APIClient } from '../../../../../utils/client';

Template.contactChatHistoryItem.helpers({
	closedAt() {
		const { closedAt } = Template.instance().room.get();
		return moment(closedAt).format('LT');
	},
	hasClosingRoomMessage() {
		return Template.instance().hasClosingRoomMessage.get();
	},
	closingRoomMessage() {
		const closingObj = Template.instance().closingRoomMessage.get();
		return closingObj.msg;
	},
});

Template.contactChatHistoryItem.onCreated(function() {
	this.room = new ReactiveVar();
	this.hasClosingRoomMessage = new ReactiveVar(false);
	this.closingRoomMessage = new ReactiveVar();
	this.autorun(async () => {
		const currentData = Template.currentData();
		this.room.set(currentData);

		/*
		const { token } = currentData.v;
		const { messages } = await APIClient.v1.get(`livechat/messages.closingMessage/${ currentData._id }?token=${ token }`);
		if (messages.length > 0) {
			this.closingRoomMessage.set(messages[0]);
			this.hasClosingRoomMessage.set(true);
		}
		*/
	});
});
