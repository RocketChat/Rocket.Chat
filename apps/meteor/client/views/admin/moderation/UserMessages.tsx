import { Box, Callout, Message, StatesAction, StatesActions, StatesIcon, StatesTitle } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';

import MessageContextFooter from './MessageContextFooter';
import ContextMessage from './helpers/ContextMessage';
import { ContextualbarFooter } from '../../../components/Contextualbar';
import GenericNoResults from '../../../components/GenericNoResults';

const UserMessages = ({ userId, onRedirect }: { userId: string; onRedirect: (mid: string) => void }) => {
	const { t } = useTranslation();
	const getUserMessages = useEndpoint('GET', '/v1/moderation.user.reportedMessages');

	const {
		data: report,
		refetch: reloadUserMessages,
		isLoading,
		isSuccess,
		isError,
	} = useQuery({
		queryKey: ['moderation', 'msgReports', 'fetchDetails', { userId }],
		queryFn: async () => {
			const messages = await getUserMessages({ userId });
			return messages;
		},
		meta: {
			apiErrorToastMessage: true,
		},
	});

	const handleChange = useEffectEvent(() => {
		reloadUserMessages();
	});

	return (
		<>
			<Box display='flex' flexDirection='column' width='full' height='full' overflowY='auto' overflowX='hidden'>
				{isLoading && <Message>{t('Loading')}</Message>}
				{isSuccess && (
					<Box padding={24}>
						{report.messages.length > 0 && (
							<Callout title={t('Moderation_Duplicate_messages')} type='warning' icon='warning'>
								{t('Moderation_Duplicate_messages_warning')}
							</Callout>
						)}
						{!report.user && (
							<Callout mbs={8} type='warning' icon='warning'>
								{t('Moderation_User_deleted_warning')}
							</Callout>
						)}
					</Box>
				)}
				{isSuccess &&
					report.messages.length > 0 &&
					report.messages.map((message) => (
						<Fragment key={message._id}>
							<ContextMessage
								message={message.message}
								room={message.room}
								onRedirect={onRedirect}
								onChange={handleChange}
								deleted={!report.user}
							/>
						</Fragment>
					))}
				{isSuccess && report.messages.length === 0 && <GenericNoResults title={t('No_message_reports')} icon='message' />}
				{isError && (
					<Box display='flex' flexDirection='column' alignItems='center' pb={20} color='default'>
						<StatesIcon name='warning' variation='danger' />
						<StatesTitle>{t('Something_went_wrong')}</StatesTitle>
						<StatesActions>
							<StatesAction onClick={handleChange}>{t('Reload_page')}</StatesAction>
						</StatesActions>
					</Box>
				)}
			</Box>
			{isSuccess && report.messages.length > 0 && (
				<ContextualbarFooter>
					<MessageContextFooter userId={userId} deleted={!report.user} />
				</ContextualbarFooter>
			)}
		</>
	);
};

export default UserMessages;
