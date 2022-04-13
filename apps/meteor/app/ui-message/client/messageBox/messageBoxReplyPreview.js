import { Template } from 'meteor/templating';
import './messageBoxReplyPreview.html';

Template.messageBoxReplyPreview.helpers({
	attachments() {
		const { replyMessageData } = this;
		let content;
		if (replyMessageData.file)
			if (replyMessageData.attachments[0]?.description)
				content = `${replyMessageData.file.name} \n ${replyMessageData.attachments[0].description}`;
			else content = replyMessageData.file.name;
		else content = replyMessageData.msg;

		return [{ text: content, author_name: replyMessageData.u.username }];
	},
});

Template.messageBoxReplyPreview.events({
	'click .cancel-reply'(event) {
		event.preventDefault();
		event.stopPropagation();

		const { mid } = event.currentTarget.dataset;
		const $input = $(this.input);

		this.input.focus();
		const messages = $input.data('reply') || [];
		const filtered = messages.filter(({ _id }) => _id !== mid);

		$input.data('reply', filtered).trigger('dataChange');
	},
});
