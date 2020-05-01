import { Template } from 'meteor/templating';
import moment from 'moment';
import './customerChatHistoryMessages.html';
import { ReactiveVar } from 'meteor/reactive-var';

import { APIClient } from '../../../../../utils/client';

Template.customerChatHistoryMessages.helpers({
	historyResult() {
		return Template.instance().historyResult.get();
	},
});
Template.customerChatHistoryMessages.onCreated(function() {
	const currentData = Template.currentData();
	this.historyResult = new ReactiveVar([]);
	this.history = new ReactiveVar([]);
	const id = currentData.clickRid;
	const token = currentData.clickToken;
	let closingDay;
	let agentName;
	this.autorun(async () => {
		const { messages } = await APIClient.v1.get(`livechat/messages.history/${ id }?token=${ token }`);
		// will return pervious chats list
		this.history.set(messages);
		const allMessages = this.history.get().reverse();
		const header = document.getElementsByClassName('contextual-bar__header-title');
		if (allMessages.length !== 0) {
			const len = allMessages.length - 1;
			agentName = allMessages[len].u.username;
			closingDay = moment(allMessages[len].ts).format('dddd');
		}
		if (header[0]) {
			header[0].innerText = `${ agentName }, closed at ${ closingDay }`;
			header[0].className = 'Contextualheading';
		}
		this.historyResult.set(allMessages);
	});
});
