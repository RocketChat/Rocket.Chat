import { Meteor } from 'meteor/meteor';

import { MessageAction } from '../../../app/ui-utils/client';
import { sdk } from '../../../app/utils/client/lib/SDKClient';
import { dispatchToastMessage } from '../../lib/toast';
import { messageArgs } from '../../lib/utils/messageArgs';
import { queryClient } from '/client/lib/queryClient';

Meteor.startup(() => {
	MessageAction.addButton({
		id: 'mark-as-done-message',
		icon: 'checkmark-circled',
		label: 'Done',
		type: 'interaction',
		context: ['message', 'message-mobile', 'threads', 'direct', 'videoconf', 'videoconf-threads'],
		async action(_, props) {
			const { message = messageArgs(this).msg } = props;

			try {
				await sdk.call('markAsDoneMessage', { ...message, markedAsDone: true });
				queryClient.invalidateQueries(['rooms', message.rid, 'marked-as-done-messages']);
			} catch (error) {
				if (error) {
					dispatchToastMessage({ type: 'error', message: error });
				}
			}
		},
		condition({ message, user }) {
			return !Array.isArray(message.markedAsDone) || !message.markedAsDone.find((done: any) => done._id === user?._id);
		},
		order: 3,
		group: 'message',
	});
});
