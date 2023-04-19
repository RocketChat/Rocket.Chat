import { Meteor } from 'meteor/meteor';

import { settings } from '../../../app/settings/client';
import { MessageAction } from '../../../app/ui-utils/client';
import { queryClient } from '../../lib/queryClient';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import { dispatchToastMessage } from '../../lib/toast';
import { messageArgs } from '../../lib/utils/messageArgs';

Meteor.startup(() => {
	MessageAction.addButton({
		id: 'star-message',
		icon: 'star',
		label: 'Star',
		context: ['starred', 'message', 'message-mobile', 'threads', 'federated'],
		action(_, props) {
			const { message = messageArgs(this).msg } = props;
			Meteor.call('starMessage', { ...message, starred: true }, (error: any) => {
				if (error) {
					dispatchToastMessage({ type: 'error', message: error });
					return;
				}

				queryClient.invalidateQueries(['rooms', message.rid, 'starred-messages']);
			});
		},
		condition({ message, subscription, user, room }) {
			if (subscription == null && settings.get('Message_AllowStarring')) {
				return false;
			}
			const isLivechatRoom = roomCoordinator.isLivechatRoom(room.t);
			if (isLivechatRoom) {
				return false;
			}

			return !Array.isArray(message.starred) || !message.starred.find((star: any) => star._id === user?._id);
		},
		order: 9,
		group: 'menu',
	});
});
