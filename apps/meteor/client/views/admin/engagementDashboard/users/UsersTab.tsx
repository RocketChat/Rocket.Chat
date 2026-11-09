import { Stack } from '@rocket.chat/fuselage';
import { useBreakpoints } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from 'react-i18next';

import ActiveUsersSection from './ActiveUsersSection';
import BusiestChatTimesSection from './BusiestChatTimesSection';
import NewUsersSection from './NewUsersSection';
import UsersByTimeOfTheDaySection from './UsersByTimeOfTheDaySection';
import DashboardCardPair from '../layout/DashboardCardPair';
import EngagementDashboardCard from '../layout/EngagementDashboardCard';

export type UsersTabProps = {
	timezone: 'utc' | 'local';
};

const UsersTab = ({ timezone }: UsersTabProps) => {
	const { t } = useTranslation();

	const isXxlScreen = useBreakpoints().includes('xxl');

	return (
		<Stack gap='x32'>
			<Stack gap='x16'>
				<EngagementDashboardCard title={t('New_users')}>
					<NewUsersSection timezone={timezone} />
				</EngagementDashboardCard>
				<EngagementDashboardCard title={t('Active_users')}>
					<ActiveUsersSection timezone={timezone} />
				</EngagementDashboardCard>
			</Stack>
			<DashboardCardPair
				stacked={!isXxlScreen}
				start={
					<EngagementDashboardCard title={t('Users_by_time_of_day')}>
						<UsersByTimeOfTheDaySection timezone={timezone} />
					</EngagementDashboardCard>
				}
				end={
					<EngagementDashboardCard title={t('When_is_the_chat_busier?')}>
						<BusiestChatTimesSection timezone={timezone} />
					</EngagementDashboardCard>
				}
			/>
		</Stack>
	);
};

export default UsersTab;
