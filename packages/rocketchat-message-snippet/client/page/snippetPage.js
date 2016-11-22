/* global SnippetedMessages */
import moment from 'moment';

Template.snippetPage.helpers({
	snippet: function() {
		return SnippetedMessages.findOne({ _id: FlowRouter.getParam('snippetId') });
	},
	snippetContent: function() {
		let message = SnippetedMessages.findOne({ _id: FlowRouter.getParam('snippetId') });
		if (message === undefined) {
			return null;
		}
		message.html = message.msg;
		let markdownCode = new RocketChat.MarkdownCode(message);
		return markdownCode.tokens[0].text;
	},
	date() {
		let snippet = SnippetedMessages.findOne({ _id: FlowRouter.getParam('snippetId') });
		if (snippet !== undefined) {
			return moment(snippet.ts).format(RocketChat.settings.get('Message_DateFormat'));
		}
	},
	time() {
		let snippet = SnippetedMessages.findOne({ _id: FlowRouter.getParam('snippetId') });
		if (snippet !== undefined) {
			return moment(snippet.ts).format(RocketChat.settings.get('Message_TimeFormat'));
		}
	}
});

Template.snippetPage.onCreated(function() {
	let snippetId = FlowRouter.getParam('snippetId');
	this.autorun(function() {
		Meteor.subscribe('snippetedMessage', snippetId);
	});
});

