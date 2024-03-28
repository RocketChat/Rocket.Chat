import { useStream } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import store from '../store';

// TODO: optimize this function
const deleteMessage = (messageId: string) => {
	store.setState({
		messages: store.state.messages.filter((message) => message._id !== messageId),
	});
};

export const useDeleteMessageSubscription = (rid: string) => {
	const stream = useStream('notify-room');

	useEffect(() => {
		if (!rid) {
			return;
		}
		return stream(`${rid}/deleteMessage`, async ({ _id }) => {
			deleteMessage(_id);
		});
	}, [rid, stream]);
};
