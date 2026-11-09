import { Stack } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import MessagesPerChannelSection from './MessagesPerChannelSection';
import MessagesSentSection from './MessagesSentSection';
import EngagementDashboardCard from '../layout/EngagementDashboardCard';

export type MessagesTabProps = {
	timezone: 'utc' | 'local';
};

const MessagesTab = ({ timezone }: MessagesTabProps) => {
	const { t } = useTranslation();

	return (
		<Stack gap='x16'>
			<EngagementDashboardCard title={t('Messages_sent')}>
				<MessagesSentSection timezone={timezone} />
			</EngagementDashboardCard>
			<EngagementDashboardCard title={t('Where_are_the_messages_being_sent?')}>
				<MessagesPerChannelSection />
			</EngagementDashboardCard>
		</Stack>
	);
};

export default MessagesTab;
