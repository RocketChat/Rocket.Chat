import { registerFieldTemplate } from '/app/message-attachments';
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
		const [, { trid }] = this._arguments;
		FlowRouter.goToRoomById(trid);
	},
};

registerFieldTemplate('messageCounter', 'MessageCounter', events);
