import { Template } from 'meteor/templating';
import './messageBoxReplyPreview.html';


Template.messageBoxReplyPreview.events({
	'click .cancel-reply'() {
		const { input } = this;
		input.focus();
		$(input).removeData('reply').trigger('dataChange'); // TODO: remove jQuery event layer dependency
	},
});
