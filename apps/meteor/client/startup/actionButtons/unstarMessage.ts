import { Meteor } from 'meteor/meteor';

import { settings } from '../../../app/settings/client';
import { MessageAction } from '../../../app/ui-utils/client';
import { sdk } from '../../../app/utils/client/lib/SDKClient';
import { toggleStarredMessage } from '../../lib/mutationEffects/starredMessage';
import { queryClient } from '../../lib/queryClient';
import { roomsQueryKeys } from '../../lib/queryKeys';
import { dispatchToastMessage } from '../../lib/toast';

Meteor.startup(() => {
	MessageAction.addButton({
		id: 'unstar-message',
		icon: 'star',
		label: 'Unstar_Message',
		type: 'interaction',
		context: ['starred', 'message', 'message-mobile', 'threads', 'federated', 'videoconf', 'videoconf-threads'],
		async action(_, { message }) {
			try {
				await sdk.rest.post('/v1/chat.unStarMessage', { messageId: message._id });
				toggleStarredMessage(message, false);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				queryClient.invalidateQueries(roomsQueryKeys.starredMessages(message.rid));
				queryClient.invalidateQueries(roomsQueryKeys.messageActions(message.rid, message._id));
			}
		},
		condition({ message, subscription, user }) {
			if (subscription == null && settings.get('Message_AllowStarring')) {
				return false;
			}

			return Boolean(message.starred?.find((star: any) => star._id === user?._id));
		},
		order: 3,
		group: 'menu',
	});
});
