import type { IMessage } from '@rocket.chat/core-typings';
import type { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import './messageBoxReplyPreview.html';

type MessageBoxReplyPreviewTemplateInstance = Blaze.TemplateInstance<{
	input: HTMLInputElement | HTMLTextAreaElement;
	replyMessageData: IMessage;
	onDismiss: (mid: IMessage['_id']) => void;
}>;

Template.messageBoxReplyPreview.helpers({
	attachments(this: MessageBoxReplyPreviewTemplateInstance['data']) {
		const { replyMessageData } = this;
		return [{ text: replyMessageData.msg, author_name: replyMessageData.u.username }];
	},
});

Template.messageBoxReplyPreview.events({
	'click .cancel-reply'(this: MessageBoxReplyPreviewTemplateInstance['data'], event: JQuery.ClickEvent) {
		event.preventDefault();
		event.stopPropagation();

		const { mid } = event.currentTarget.dataset;
		this.onDismiss(mid);

		this.input.focus();
	},
});
