import React, { FC, useMemo, memo } from 'react';

import { useFormatTime } from '../../../hooks/useFormatTime';
import { MessageContext } from '../contexts/MessageContext';

const openUserCard = () => {
	console.log('openUserCard');
};
const followMessage = () => {
	console.log('followMessage');
};
const openDiscussion = () => {
	console.log('openDiscussion');
};
const openThread = () => {
	console.log('openThread');
};
const replyBroadcast = () => {
	console.log('replyBroadcast');
};

const MessageProvider: FC = ({ children }): JSX.Element => {
	const messageHeader = useFormatTime();
	const context = useMemo(
		() => ({
			broadcast: true,
			actions: {
				openUserCard,
				followMessage,
				// unfollowMessage,
				openDiscussion,
				openThread,
				replyBroadcast,
			},
			formatters: {
				messageHeader,
			},
		}),
		[messageHeader],
	);

	return <MessageContext.Provider value={context}>{children}</MessageContext.Provider>;
};

export default memo(MessageProvider);
