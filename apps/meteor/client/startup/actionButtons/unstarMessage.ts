import { Meteor } from 'meteor/meteor';

import { settings } from '../../../app/settings/client';
import { MessageAction } from '../../../app/ui-utils/client';
import { sdk } from '../../../app/utils/client/lib/SDKClient';
import { queryClient } from '../../lib/queryClient';
import { dispatchToastMessage } from '../../lib/toast';
import { messageArgs } from '../../lib/utils/messageArgs';

Meteor.startup(() => {
	MessageAction.addButton({
		id: 'unstar-message',
		icon: 'star',
		label: 'Unstar_Message',
		context: ['starred', 'message', 'message-mobile', 'threads', 'federated', 'videoconf', 'videoconf-threads'],
		async action(_, props) {
			const { message = messageArgs(this).msg } = props;

			try {
				await sdk.call('starMessage', { ...message, starred: false });
				queryClient.invalidateQueries(['rooms', message.rid, 'starred-messages']);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		},
		condition({ message, subscription, user }) {
			if (subscription == null && settings.get('Message_AllowStarring')) {
				return false;
			}

			return Boolean(message.starred?.find((star: any) => star._id === user?._id));
		},
		order: 9,
		group: 'menu',
	});
});
