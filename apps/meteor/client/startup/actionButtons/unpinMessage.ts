import { Meteor } from 'meteor/meteor';

import { hasAtLeastOnePermission } from '../../../app/authorization/client';
import { settings } from '../../../app/settings/client';
import { MessageAction } from '../../../app/ui-utils/client';
import { sdk } from '../../../app/utils/client/lib/SDKClient';
import { queryClient } from '../../lib/queryClient';
import { dispatchToastMessage } from '../../lib/toast';
import { messageArgs } from '../../lib/utils/messageArgs';

Meteor.startup(() => {
	MessageAction.addButton({
		id: 'unpin-message',
		icon: 'pin',
		label: 'Unpin',
		context: ['pinned', 'message', 'message-mobile', 'threads', 'direct', 'videoconf', 'videoconf-threads'],
		async action(_, props) {
			const { message = messageArgs(this).msg } = props;
			message.pinned = false;
			try {
				await sdk.call('unpinMessage', message);
				queryClient.invalidateQueries(['rooms', message.rid, 'pinned-messages']);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		},
		condition({ message, subscription }) {
			if (!subscription || !settings.get('Message_AllowPinning') || !message.pinned) {
				return false;
			}

			return hasAtLeastOnePermission('pin-message', message.rid);
		},
		order: 8,
		group: 'menu',
	});
});
