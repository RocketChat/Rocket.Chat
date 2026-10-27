import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { useBreakpoints } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from 'react-i18next';

import EngagementDashboardCard from '../EngagementDashboardCard';
import ActiveUsersSection from './ActiveUsersSection';
import BusiestChatTimesSection from './BusiestChatTimesSection';
import NewUsersSection from './NewUsersSection';
import UsersByTimeOfTheDaySection from './UsersByTimeOfTheDaySection';

export type UsersTabProps = {
	timezone: 'utc' | 'local';
};

const UsersTab = ({ timezone }: UsersTabProps) => {
	const { t } = useTranslation();

	const isXxlScreen = useBreakpoints().includes('xxl');

	return (
		<>
			<EngagementDashboardCard title={t('New_users')}>
				<NewUsersSection timezone={timezone} />
			</EngagementDashboardCard>
			<EngagementDashboardCard title={t('Active_users')}>
				<ActiveUsersSection timezone={timezone} />
			</EngagementDashboardCard>
			<Box
				display='flex'
				flexWrap='wrap'
				style={{ columnGap: '16px' }}
				className={css`
					& > * {
						flex: 1 0 ${isXxlScreen ? '0' : '100%'};
					}
				`}
			>
				<EngagementDashboardCard title={t('Users_by_time_of_day')}>
					<UsersByTimeOfTheDaySection timezone={timezone} />
				</EngagementDashboardCard>
				<EngagementDashboardCard title={t('When_is_the_chat_busier?')}>
					<BusiestChatTimesSection timezone={timezone} />
				</EngagementDashboardCard>
			</Box>
		</>
	);
};

export default UsersTab;
