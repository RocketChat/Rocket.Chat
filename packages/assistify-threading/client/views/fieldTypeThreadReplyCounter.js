import { registerFieldTemplate } from 'meteor/rocketchat:message-attachments';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

Template.MessageCounter.helpers({
	hasReplies() {
		return Template.instance().data.field.count > 0;
	},

	replyCount() {
		return Template.instance().data.field.count;
	},

	i18nKeyReply() {
		return Template.instance().data.field.count > 1
			? 'Replies'
			: 'Reply';
	},

});

const events = {
	'click .js-navigate-to-thread'(event) {
		event.preventDefault();
		FlowRouter.goToRoomById(event.target.dataset.rid);
	},
};

registerFieldTemplate('messageCounter', 'MessageCounter', events);
