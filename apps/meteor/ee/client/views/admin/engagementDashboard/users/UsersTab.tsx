import { Box, Flex } from '@rocket.chat/fuselage';
import { useBreakpoints } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import EngagementDashboardCard from '../EngagementDashboardCard';
import ActiveUsersSection from './ActiveUsersSection';
import BusiestChatTimesSection from './BusiestChatTimesSection';
import NewUsersSection from './NewUsersSection';
import UsersByTimeOfTheDaySection from './UsersByTimeOfTheDaySection';

type UsersTabProps = {
	timezone: 'utc' | 'local';
};

const UsersTab = ({ timezone }: UsersTabProps): ReactElement => {
	const t = useTranslation();

	const isXxlScreen = useBreakpoints().includes('xxl');

	return (
		<>
			<EngagementDashboardCard title={t('New_users')}>
				<NewUsersSection timezone={timezone} />
			</EngagementDashboardCard>
			<EngagementDashboardCard title={t('Active_users')}>
				<ActiveUsersSection timezone={timezone} />
			</EngagementDashboardCard>
			<Box display='flex' flexWrap='wrap' style={{ columnGap: '16px' }}>
				<Flex.Item grow={1} shrink={0} basis={isXxlScreen ? '0' : '100%'}>
					<EngagementDashboardCard title={t('Users_by_time_of_day')}>
						<UsersByTimeOfTheDaySection timezone={timezone} />
					</EngagementDashboardCard>
				</Flex.Item>
				<Box flexGrow={1} flexShrink={0} flexBasis={isXxlScreen ? '0' : '100%'}>
					<EngagementDashboardCard title={t('When_is_the_chat_busier?')}>
						<BusiestChatTimesSection timezone={timezone} />
					</EngagementDashboardCard>
				</Box>
			</Box>
		</>
	);
};

export default UsersTab;
