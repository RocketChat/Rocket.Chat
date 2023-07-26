import { Box, Callout, Message, StatesAction, StatesActions, StatesIcon, StatesTitle } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useRouter, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import { ContextualbarHeader, ContextualbarTitle, ContextualbarClose, ContextualbarFooter } from '../../../components/Contextualbar';
import GenericNoResults from '../../../components/GenericNoResults';
import MessageContextFooter from './MessageContextFooter';
import ContextMessage from './helpers/ContextMessage';

// TODO: Missing Error State
const UserMessages = ({ userId, onRedirect }: { userId: string; onRedirect: (mid: string) => void }): JSX.Element => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const moderationRoute = useRouter();
	const getUserMessages = useEndpoint('GET', '/v1/moderation.user.reportedMessages');

	const {
		data: userMessages,
		refetch: reloadUserMessages,
		isLoading: isLoadingUserMessages,
		isSuccess: isSuccessUserMessages,
		isError,
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

	const handleChange = useMutableCallback(() => {
		reloadUserMessages();
	});

	return (
		<>
			<ContextualbarHeader>
				<ContextualbarTitle>{t('Moderation_Message_context_header')}</ContextualbarTitle>
				<ContextualbarClose onClick={() => moderationRoute.navigate('/admin/moderation', { replace: true })} />
			</ContextualbarHeader>
			{isLoadingUserMessages && <Message>{t('Loading')}</Message>}
			{isSuccessUserMessages && userMessages.messages.length > 0 && (
				<>
					<Box display='flex' flexDirection='column' width='full' height='full' overflowY='auto' overflowX='hidden'>
						<Callout margin={15} title={t('Moderation_Duplicate_messages')} type='warning' icon='warning'>
							{t('Moderation_Duplicate_messages_warning')}
						</Callout>{' '}
						{userMessages.messages.map((message) => (
							<Box key={message._id}>
								<ContextMessage message={message.message} room={message.room} onRedirect={onRedirect} onChange={handleChange} />
							</Box>
						))}
					</Box>
					<ContextualbarFooter display='flex'>
						<MessageContextFooter userId={userId} />
					</ContextualbarFooter>
				</>
			)}
			{isSuccessUserMessages && userMessages.messages.length === 0 && <GenericNoResults />}
			{isError && (
				<Box display='flex' flexDirection='column' alignItems='center' pb='x20' color='default'>
					<StatesIcon name='warning' variation='danger' />
					<StatesTitle>{t('Something_went_wrong')}</StatesTitle>
					<StatesActions>
						<StatesAction onClick={handleChange}>{t('Reload_page')}</StatesAction>
					</StatesActions>
				</Box>
			)}
		</>
	);
};

export default UserMessages;
