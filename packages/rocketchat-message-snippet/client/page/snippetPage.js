/* global Messages */
Template.snippetPage.helpers({
	snippet: function() {
		return Messages.findOne({ _id: FlowRouter.getParam('snippetId') });
	},
	snippetContent: function() {
		let message = Messages.findOne({ _id: FlowRouter.getParam('snippetId') });
		if (message === undefined) {
			return null;
		} else {
			message.html = message.msg;
			let markdownCode = new RocketChat.MarkdownCode(message);
			return markdownCode.tokens[0].text;
		}
	},
	date() {
		let snippet = Messages.findOne({ _id: FlowRouter.getParam('snippetId') });
		if (snippet !== undefined) {
			return moment(snippet.ts).format(RocketChat.settings.get('Message_DateFormat'));
		}
	},
	time() {
		let snippet = Messages.findOne({ _id: FlowRouter.getParam('snippetId') });
		if (snippet !== undefined) {
			return moment(snippet.ts).format(RocketChat.settings.get('Message_TimeFormat'));
		}
	}
});

Template.snippetPage.onCreated(function() {
	let snippetId = FlowRouter.getParam('snippetId');
	console.log(`${snippetId}: ${this.snippet}`);
	this.autorun(function() {
		Meteor.subscribe('snippetedMessage', snippetId);
	});
});

