/* global SnippetedMessage, Messages */
Template.snippetPage.helpers({
	snippet: function() {
		return SnippetedMessage.findOne({ _id: FlowRouter.getParam('snippetId') });
	},
	snippetContent: function() {
		let message = Messages.findOne({snippetId: FlowRouter.getParam('snippetId')});
		if (message === undefined) {
			return null;
		} else {
			message.html = message.msg;
			let markdownCode = new RocketChat.MarkdownCode(message);
			return markdownCode.tokens[0].text;
		}
	},
	own() {
		let snippet = SnippetedMessage.findOne({ _id: FlowRouter.getParam('snippetId') });
		if (snippet !== undefined &&
			snippet.u !== undefined &&
			snippet.u._id === Meteor.userId()) {
			return 'own';
		}
		return null;
	},
	date() {
		let snippet = SnippetedMessage.findOne({ _id: FlowRouter.getParam('snippetId') });
		if (snippet !== undefined) {
			console.log(snippet.ts);
			return moment(snippet.ts).format(RocketChat.settings.get('Message_DateFormat'));
		}
	},
	time() {
		let snippet = SnippetedMessage.findOne({ _id: FlowRouter.getParam('snippetId') });
		if (snippet !== undefined) {
			return moment(snippet.ts).format(RocketChat.settings.get('Message_TimeFormat'));
		}
	}
});

Template.snippetPage.onCreated(function() {
	this.autorun(function() {
		let snippetId = FlowRouter.getParam('snippetId');
		Meteor.subscribe('retrieveSnippetedMessage', snippetId);
		Meteor.subscribe('retrieveSnippetMessage', snippetId);
	});
});

