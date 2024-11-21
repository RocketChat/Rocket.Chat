import { Meteor } from 'meteor/meteor';

import { settings } from '../../../app/settings/client';
import { MessageAction } from '../../../app/ui-utils/client';
import { sdk } from '../../../app/utils/client/lib/SDKClient';
import { toggleStarredMessage } from '../../lib/mutationEffects/starredMessage';
import { queryClient } from '../../lib/queryClient';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import { dispatchToastMessage } from '../../lib/toast';

Meteor.startup(() => {
	MessageAction.addButton({
		id: 'star-message',
		icon: 'star',
		label: 'Star',
		type: 'interaction',
		context: ['starred', 'message', 'message-mobile', 'threads', 'federated', 'videoconf', 'videoconf-threads'],
		async action(_, { message }) {
			try {
				await sdk.rest.post('/v1/chat.starMessage', { messageId: message._id });
				toggleStarredMessage(message, true);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				queryClient.invalidateQueries(['rooms', message.rid, 'starred-messages']);
			}
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
		order: 3,
		group: 'menu',
	});
});
