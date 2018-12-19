import { registerFieldTemplate } from 'meteor/rocketchat:message-attachments';
import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

Template.MessageCounter.helpers({
	hasReplies() {
		return Template.instance().threadReplies.get() > 0;
	},

	replyCount() {
		return Template.instance().threadReplies.get();
	},

	i18nKeyReply() {
		return Template.instance().threadReplies.get() > 1
			? 'Replies'
			: 'Reply';
	},

});

Template.MessageCounter.onCreated(function() {
	this.threadReplies = new ReactiveVar(2); // just some dummy value until it's reactive
});

Template.MessageCounter.onRendered(function() {
	// this is - unfortunately - not invoked since no real rendering is performed. see renderField.js and the comments there

	Meteor.call('getRoomMessageMetadata', this.data.field.roomId, (err, metadata) => {
		const { visibleMessagesCount } = metadata;

		if (!err) {
			this.threadReplies.set(visibleMessagesCount - 1);

			// here, some magic needs to happen in order to trigger a re-rendering - or at least refresh the DOM
			console.log(this.find('.no-replies'));
		}
	});
});

const events = {
	'click .js-navigate-to-thread'(event) {
		event.preventDefault();
		FlowRouter.goToRoomById(event.target.dataset.rid);
	},
};

registerFieldTemplate('messageCounter', 'MessageCounter', events);
