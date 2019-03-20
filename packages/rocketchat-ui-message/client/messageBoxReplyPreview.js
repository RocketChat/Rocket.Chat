import { Template } from 'meteor/templating';
import './messageBoxReplyPreview.html';


Template.messageBoxReplyPreview.events({
	'click .cancel-reply'(event, instance) {
		const { input } = this;
		input.focus();
		$(input).removeData('reply').trigger('dataChange'); // TODO: remove jQuery event layer dependency
	},
});


Template.messageBoxReplyPreview.helpers({
	isInReplyView() {
		let isInReplyView = false;
		let instance = Template.instance().parentTemplate(2);
		if ( instance && instance.data && instance.data.tabBar 
			&& instance.data.tabBar.template.curValue === 'RocketReplies' ) {
			isInReplyView = true;
		}
		return isInReplyView;
	}
})