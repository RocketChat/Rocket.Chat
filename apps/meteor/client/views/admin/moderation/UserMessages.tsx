import { Box, Message } from '@rocket.chat/fuselage';
import { useEndpoint, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useEffect } from 'react';
import type { MutableRefObject } from 'react';

import UserAvatar from '../../../components/avatar/UserAvatar';
import { formatDate } from '../../../lib/utils/formatDate';
import { formatTime } from '../../../lib/utils/formatTime';

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
		<Box display='flex' flexDirection='column' width='full' height='full'>
			{isLoadingUserMessages && <Message>{t('Loading')}</Message>}
			{isSuccessUserMessages &&
				userMessages.messages.map((message) => (
					<Box key={message._id}>
						<Message.Divider>{formatDate(message.message._updatedAt)}</Message.Divider>
						<Message>
							<Message.LeftContainer>
								<UserAvatar username={message.message.u.username} />
							</Message.LeftContainer>
							<Message.Container>
								<Message.Header>
									<Message.Name>{message.message.u.name}</Message.Name>
									<Message.Username> @{message.message.u.username}</Message.Username>
									<Message.Timestamp>{formatTime(message.message._updatedAt)}</Message.Timestamp>
								</Message.Header>
								<Message.Body>{message.message.msg}</Message.Body>
							</Message.Container>
						</Message>
					</Box>
				))}
		</Box>
	);
};

export default UserMessages;
