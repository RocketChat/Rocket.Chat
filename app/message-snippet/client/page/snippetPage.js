import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import moment from 'moment';

import { DateFormat } from '../../../lib';
import { settings } from '../../../settings';
import { Markdown } from '../../../markdown/client';
import { SnippetedMessages } from '../lib/collections';

Template.snippetPage.helpers({
	snippet() {
		return SnippetedMessages.findOne({ _id: FlowRouter.getParam('snippetId') });
	},
	snippetContent() {
		const message = SnippetedMessages.findOne({ _id: FlowRouter.getParam('snippetId') });
		if (message === undefined) {
			return null;
		}
		message.html = message.msg;
		const markdown = Markdown.parse(message);
		return markdown.tokens[0].text;
	},
	date() {
		const snippet = SnippetedMessages.findOne({ _id: FlowRouter.getParam('snippetId') });
		if (snippet !== undefined) {
			return moment(snippet.ts).format(settings.get('Message_DateFormat'));
		}
	},
	time() {
		const snippet = SnippetedMessages.findOne({ _id: FlowRouter.getParam('snippetId') });
		if (snippet !== undefined) {
			return DateFormat.formatTime(snippet.ts);
		}
	},
});

Template.snippetPage.onCreated(function() {
	const snippetId = FlowRouter.getParam('snippetId');
	this.autorun(function() {
		Meteor.subscribe('snippetedMessage', snippetId);
	});
});
