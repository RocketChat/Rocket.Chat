import { FlowRouter } from 'meteor/kadira:flow-router';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import moment from 'moment';

import { settings } from '../../../settings';
import { Markdown } from '../../../markdown/client';
import { APIClient } from '../../../utils/client';
import { formatTime } from '../../../../client/lib/utils/formatTime';

Template.snippetPage.helpers({
	snippet() {
		return Template.instance().message.get();
	},
	snippetContent() {
		const message = Template.instance().message.get();
		if (message === undefined) {
			return null;
		}
		message.html = message.msg;
		const markdown = Markdown.parse(message);
		return markdown.tokens[0].text;
	},
	date() {
		const snippet = Template.instance().message.get();
		if (snippet !== undefined) {
			return moment(snippet.ts).format(settings.get('Message_DateFormat'));
		}
	},
	time() {
		const snippet = Template.instance().message.get();
		if (snippet !== undefined) {
			return formatTime(snippet.ts);
		}
	},
});

Template.snippetPage.onCreated(async function () {
	const snippetId = FlowRouter.getParam('snippetId');
	this.message = new ReactiveVar({});

	const { message } = await APIClient.v1.get(`chat.getSnippetedMessageById?messageId=${snippetId}`);
	this.message.set(message);
});
