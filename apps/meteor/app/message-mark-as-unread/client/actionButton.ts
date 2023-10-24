import { Meteor } from 'meteor/meteor';

import { roomCoordinator } from '../../../client/lib/rooms/roomCoordinator';
import { dispatchToastMessage } from '../../../client/lib/toast';
import { messageArgs } from '../../../client/lib/utils/messageArgs';
import { router } from '../../../client/providers/RouterProvider';
import { ChatSubscription } from '../../models/client';
import { LegacyRoomManager, MessageAction } from '../../ui-utils/client';
import { sdk } from '../../utils/client/lib/SDKClient';

Meteor.startup(() => {
	MessageAction.addButton({
		id: 'mark-message-as-unread',
		icon: 'flag',
		label: 'Mark_unread',
		context: ['message', 'message-mobile', 'threads'],
		type: 'interaction',
		async action(_, props) {
			const { message = messageArgs(this).msg } = props;

			try {
				await sdk.call('unreadMessages', message);
				const subscription = ChatSubscription.findOne({
					rid: message.rid,
				});

				if (subscription == null) {
					return;
				}
				await LegacyRoomManager.close(subscription.t + subscription.name);
				return router.navigate('/home');
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		},
		condition({ message, user, room }) {
			const isLivechatRoom = roomCoordinator.isLivechatRoom(room.t);
			if (isLivechatRoom) {
				return false;
			}

			if (!user) {
				return false;
			}

			return message.u._id !== user._id;
		},
		order: 4,
		group: 'menu',
	});
});
