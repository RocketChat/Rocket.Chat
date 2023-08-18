import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { roomCoordinator } from '../../../../client/lib/rooms/roomCoordinator';
import { messageArgs } from '../../../../client/lib/utils/messageArgs';
import { router } from '../../../../client/providers/RouterProvider';
import { settings } from '../../../settings/client';
import { MessageAction } from '../../../ui-utils/client';

Meteor.startup(() => {
	Tracker.autorun(() => {
		if (!settings.get('Threads_enabled')) {
			return MessageAction.removeButton('reply-in-thread');
		}
		MessageAction.addButton({
			id: 'reply-in-thread',
			icon: 'thread',
			label: 'Reply_in_thread',
			context: ['message', 'message-mobile', 'videoconf'],
			action(e, props) {
				const { message = messageArgs(this).msg } = props;
				e.stopPropagation();
				router.navigate({
					name: router.getRouteName()!,
					params: {
						...router.getRouteParameters(),
						tab: 'thread',
						context: message.tmid || message._id,
					},
				});
			},
			condition({ subscription, room }) {
				const isLivechatRoom = roomCoordinator.isLivechatRoom(room.t);
				if (isLivechatRoom) {
					return false;
				}
				return Boolean(subscription);
			},
			order: -1,
			group: ['message', 'menu'],
		});
	});
});
