import { Box, Callout, Message, States, StatesIcon, StatesTitle } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useRoute, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';

import VerticalBar from '../../../components/VerticalBar';
import { useUserDisplayName } from '../../../hooks/useUserDisplayName';
import MessageContextFooter from './MessageContextFooter';
import ContextMessage from './helpers/ContextMessage';

const UserMessages = ({ userId, onRedirect }: { userId: string; onRedirect: (mid: string) => void }): JSX.Element => {
	const t = useTranslation();

	const moderationRoute = useRoute('moderation-console');

	const getUserMessages = useEndpoint('GET', '/v1/moderation.user.reportedMessages');

	const dispatchToastMessage = useToastMessageDispatch();

	const {
		data: userMessages,
		refetch: reloadUserMessages,
		isLoading: isLoadingUserMessages,
		isSuccess: isSuccessUserMessages,
	} = useQuery(
		['moderation.userMessages', { userId }],
		async () => {
			const messages = await getUserMessages({ userId });
			return messages;
		},
		{
			onError: (error) => {
				dispatchToastMessage({ type: 'error', message: error });
			},
		},
	);

	// opens up the 'reports' tab when the user clicks on a user in the 'users' tab

	const handleClick = useMutableCallback((id): void => {
		moderationRoute.push({
			context: 'reports',
			id,
		});
	});

	const handleChange = useMutableCallback(() => {
		reloadUserMessages();
	});

	const username = useMemo(() => {
		if (userMessages?.messages[0]?.message?.u?.username) {
			return userMessages?.messages[0].message.u.username;
		}
		return '';
	}, [userMessages?.messages]);

	const name = useMemo(() => {
		if (userMessages?.messages[0]?.message?.u?.name) {
			return userMessages?.messages[0].message.u.name;
		}
		return '';
	}, [userMessages?.messages]);

	const displayName =
		useUserDisplayName({
			name,
			username,
		}) || userId;

	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Text>{t('Moderation_Message_context_header', { displayName })}</VerticalBar.Text>
				<VerticalBar.Close onClick={() => moderationRoute.push({})} />
			</VerticalBar.Header>
			<Box display='flex' flexDirection='column' width='full' height='full' overflowY='auto' overflowX='hidden'>
				{isSuccessUserMessages && userMessages.messages.length > 0 && (
					<Callout margin={15} title={t('Moderation_Duplicate_messages')} type='warning' icon='warning'>
						{t('Moderation_Duplicate_messages_warning')}
					</Callout>
				)}{' '}
				{isLoadingUserMessages && <Message>{t('Loading')}</Message>}
				{isSuccessUserMessages &&
					userMessages.messages.length > 0 &&
					userMessages.messages.map((message) => (
						<Box key={message._id}>
							<ContextMessage
								message={message.message}
								room={message.room}
								handleClick={handleClick}
								onRedirect={onRedirect}
								onChange={handleChange}
							/>
						</Box>
					))}
				{isSuccessUserMessages && userMessages.messages.length === 0 && (
					<States>
						<StatesIcon name='magnifier' />
						<StatesTitle>{t('No_results_found')}</StatesTitle>
					</States>
				)}
			</Box>
			<VerticalBar.Footer display='flex'>
				{isSuccessUserMessages && userMessages.messages.length > 0 && <MessageContextFooter userId={userId} />}
			</VerticalBar.Footer>
		</>
	);
};

export default UserMessages;
