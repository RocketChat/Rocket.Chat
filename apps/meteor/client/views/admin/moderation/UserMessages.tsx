import { Box, Callout, Message, States, StatesIcon, StatesTitle } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useRoute, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';

import VerticalBar from '../../../components/VerticalBar';
import MessageContextFooter from './MessageContextFooter';
import ContextMessage from './helpers/ContextMessage';

const UserMessages = ({
	userId,
	reload,
	onRedirect,
}: {
	userId: string;
	reload: () => void;
	onRedirect: (mid: string) => void;
}): JSX.Element => {
	const t = useTranslation();

	const moderationRoute = useRoute('moderation-console');

	const getUserMessages = useEndpoint('GET', '/v1/moderation.user.getMessageHistory');

	const query = useMemo(() => ({ userId }), [userId]);

	const dispatchToastMessage = useToastMessageDispatch();

	const {
		data: userMessages,
		refetch: reloadUserMessages,
		isLoading: isLoadingUserMessages,
		isSuccess: isSuccessUserMessages,
	} = useQuery(
		['moderation.userMessages', query],
		async () => {
			const messages = await getUserMessages(query);
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
		reload();
	});

	return (
		<>
			<Box display='flex' flexDirection='column' width='full' height='full' overflowY='auto' overflowX='hidden'>
				<Callout margin={15} title={t('Duplicate_messages')} type='warning' icon='warning'>
					{t('Duplicate_messages_warning')}
				</Callout>{' '}
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
								onReload={reload}
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
				<MessageContextFooter userId={userId} onChange={handleChange} onReload={reload} />
			</VerticalBar.Footer>
		</>
	);
};

export default UserMessages;
