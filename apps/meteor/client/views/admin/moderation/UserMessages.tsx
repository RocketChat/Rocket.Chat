import { Box, Callout, Message } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useRoute, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';

import { ContextualbarHeader, ContextualbarTitle, ContextualbarClose, ContextualbarFooter } from '../../../components/Contextualbar';
import GenericNoResults from '../../../components/GenericNoResults';
import { useUserDisplayName } from '../../../hooks/useUserDisplayName';
import MessageContextFooter from './MessageContextFooter';
import ContextMessage from './helpers/ContextMessage';

// TODO: Missing Error State
const UserMessages = ({ userId, onRedirect }: { userId: string; onRedirect: (mid: string) => void }): JSX.Element => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const moderationRoute = useRoute('moderation-console');
	const getUserMessages = useEndpoint('GET', '/v1/moderation.user.reportedMessages');

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
			<ContextualbarHeader>
				<ContextualbarTitle>{t('Moderation_Message_context_header', { displayName })}</ContextualbarTitle>
				<ContextualbarClose onClick={() => moderationRoute.push({})} />
			</ContextualbarHeader>
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
				{isSuccessUserMessages && userMessages.messages.length === 0 && <GenericNoResults />}
			</Box>
			<ContextualbarFooter display='flex'>
				{isSuccessUserMessages && userMessages.messages.length > 0 && <MessageContextFooter userId={userId} />}
			</ContextualbarFooter>
		</>
	);
};

export default UserMessages;
