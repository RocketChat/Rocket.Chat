import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import EngagementDashboardCard from '../EngagementDashboardCard';
import MessagesPerChannelSection from './MessagesPerChannelSection';
import MessagesSentSection from './MessagesSentSection';

type MessagesTabProps = {
	timezone: 'utc' | 'local';
};

const MessagesTab = ({ timezone }: MessagesTabProps): ReactElement => {
	const { t } = useTranslation();

	return (
		<>
			<EngagementDashboardCard title={t('Messages_sent')}>
				<MessagesSentSection timezone={timezone} />
			</EngagementDashboardCard>
			<EngagementDashboardCard title={t('Where_are_the_messages_being_sent?')}>
				<MessagesPerChannelSection />
			</EngagementDashboardCard>
		</>
	);
};

export default MessagesTab;
