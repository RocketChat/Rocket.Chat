import type { IMessage } from '@rocket.chat/core-typings';
import { Template } from 'meteor/templating';
import './messageBoxReplyPreview.html';

Template.messageBoxReplyPreview.helpers({
	attachments() {
		const { replyMessageData } = this;
		return [{ text: replyMessageData.msg, author_name: replyMessageData.u.username }];
	},
});

Template.messageBoxReplyPreview.events({
	'click .cancel-reply'(event: JQuery.ClickEvent) {
		event.preventDefault();
		event.stopPropagation();

		const { mid } = event.currentTarget.dataset;
		const $input = $(this.input);

		this.input.focus();
		const messages: IMessage[] = $input.data('reply') || [];
		const filtered = messages.filter(({ _id }) => _id !== mid);

		$input.data('reply', filtered).trigger('dataChange');
	},
});
