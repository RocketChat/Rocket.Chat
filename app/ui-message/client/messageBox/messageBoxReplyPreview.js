import { Template } from 'meteor/templating';
import './messageBoxReplyPreview.html';


const getMessageTextPreview = ({ msg, start, end }) => {
	if (start || end) {
		return `[...] ${ msg.slice(start, end) } [...]`;
	}
	return msg;
};

Template.messageBoxReplyPreview.helpers({
	attachments() {
		const { replyMessageData } = this;
		const message = getMessageTextPreview(replyMessageData);
		return [{ text: message, author_name: replyMessageData.u.username }];
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
