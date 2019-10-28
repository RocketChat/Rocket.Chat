import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { Template } from 'meteor/templating';

import { settings } from '../../../settings/client';
import { MessageAction } from '../../../ui-utils/client';
import { messageArgs } from '../../../ui-utils/client/lib/messageArgs';
import { chatMessages } from '../../../ui/client';
import { addMessageToList } from '../../../ui-utils/client/lib/MessageAction';

Template.room.events({
	'click [data-message-action="reply-in-thread"]'(event, template) {
		const button = MessageAction.getButtonById(event.currentTarget.dataset.messageAction);
		if ((button != null ? button.action : undefined) != null) {
			button.action.call(this, event, template);
		}
	},
});

Meteor.startup(function() {
	Tracker.autorun(() => {
		if (!settings.get('Threads_enabled')) {
			return MessageAction.removeButton('reply-in-thread');
		}
		MessageAction.addButton({
			id: 'reply-in-thread',
			icon: 'thread',
			label: 'Reply_in_thread',
			context: ['message', 'message-mobile', 'threads'],
			action() {
				const { msg: message } = messageArgs(this);
				const { input } = chatMessages[message.rid];
				const $input = $(input);

				const messages = addMessageToList($input.data('reply') || [], message, input);

				$(input)
					.focus()
					.data('mention-user', true)
					.data('reply', messages)
					.trigger('dataChange');
			},
			condition({ subscription }) {
				return Boolean(subscription);
			},
			order: 1,
			group: 'message',
		});
	});
});
