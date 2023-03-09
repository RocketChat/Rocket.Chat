import { Box, Message } from '@rocket.chat/fuselage';
import { useEndpoint, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useEffect } from 'react';
import type { MutableRefObject } from 'react';

import ContextMessage from './helpers/ContextMessage';

const UserMessages = ({ userId, reload }: { userId: string; reload: MutableRefObject<() => void> }): JSX.Element => {
	const t = useTranslation();

	const getUserMessages = useEndpoint('GET', '/v1/moderation.user.getMessageHistory');

	const query = useMemo(() => ({ userId }), [userId]);

	const dispatchToastMessage = useToastMessageDispatch();

	const {
		data: userMessages,
		refetch: reloadUserMessages,
		isLoading: isLoadingUserMessages,
		isSuccess: isSuccessUserMessages,
	} = useQuery(
		['userMessages', query],
		async () => {
			const messages = await getUserMessages(query);
			console.log('messages', messages);
			return messages;
		},
		{
			onError: (error) => {
				dispatchToastMessage({ type: 'error', message: error });
			},
		},
	);

	useEffect(() => {
		reload.current = reloadUserMessages;
	}, [reload, reloadUserMessages]);

	return (
		<Box display='flex' flexDirection='column' width='full' height='full' overflowY='auto' overflowX='hidden'>
			{isLoadingUserMessages && <Message>{t('Loading')}</Message>}
			{isSuccessUserMessages &&
				userMessages.messages.map((message) => (
					<Box key={message._id}>
						<ContextMessage message={message.message} room={message.room} />
					</Box>
				))}
		</Box>
	);
};

export default UserMessages;
