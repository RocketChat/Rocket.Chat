import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { settings } from '../../../settings/client';
import { MessageAction } from '../../../ui-utils/client';
import { messageArgs } from '../../../ui-utils/client/lib/messageArgs';
import { chatMessages } from '../../../ui/client';
import { addMessageToList } from '../../../ui-utils/client/lib/MessageAction';
import { Subscriptions } from '../../../models/client';

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
			condition(message) {
				return Boolean(Subscriptions.findOne({ rid: message.rid }));
			},
			order: 1,
			group: 'menu',
		});
	});
});
