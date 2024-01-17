import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import EngagementDashboardCard from '../EngagementDashboardCard';
import MessagesPerChannelSection from './MessagesPerChannelSection';
import MessagesSentSection from './MessagesSentSection';

const MessagesTab = (): ReactElement => {
	const t = useTranslation();

	return (
		<>
			<EngagementDashboardCard title={t('Messages_sent')}>
				<MessagesSentSection />
			</EngagementDashboardCard>
			<EngagementDashboardCard title={t('Where_are_the_messages_being_sent?')}>
				<MessagesPerChannelSection />
			</EngagementDashboardCard>
		</>
	);
};

export default MessagesTab;
