/* globals ReactiveVar, TAPi18n */
import { Template } from 'meteor/templating';
import { ChatMessage } from 'meteor/rocketchat:models';
import { Session } from 'meteor/session';

Template.RocketReplies.events = {};

Template.RocketReplies.helpers({
	getroomData() {
		const roomData = Session.get(`roomData${ Template.instance().data.tabBar.data.curValue.message.rid }`);
		return roomData;
	},
	parentMessage() {

		const query =
			{ _id : Template.instance().data.tabBar.data.curValue.message._id };

		const options = {
			sort: {
				ts: 1,
			}
		};

		return ChatMessage.find(query, options);
	},
	replies() {
		const query =
			{ 'customFields.ref': Template.instance().data.tabBar.data.curValue.message._id };

		const options = {
			sort: {
				ts: 1,
			},
		};

		return ChatMessage.find(query, options);
	}
});

Template.RocketReplies.onCreated(function () {

	const rid = Template.instance().data.tabBar.data.curValue.message.rid;
	const parentMessage = Template.instance().data.tabBar.data.curValue.message._id;

	Meteor.call('loadReplyHistory', rid, parentMessage, (err, result) => {
		if (err) {
			return;
		}
		const { messages = [] } = result;
		messages.forEach(msg => {
			ChatMessage.upsert({ _id: msg._id }, msg);
		});
	});

});

Template.RocketReplies.onRendered(function () {
	$('#chat-window-GENERAL > div > div.contextual-bar > section > main > footer > div > label > textarea')
		.focus()
		.data('mention-user', true)
		.data('reply',[Template.instance().data.tabBar.data.curValue.message])
		.trigger('dataChange');

});

Template.RocketReplies.onDestroyed(function () { });