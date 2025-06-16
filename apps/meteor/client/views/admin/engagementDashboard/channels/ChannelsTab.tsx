import type { ReactElement } from 'react';

import EngagementDashboardCard from '../EngagementDashboardCard';
import ChannelsOverview from './ChannelsOverview';

const ChannelsTab = (): ReactElement => (
	<EngagementDashboardCard>
		<ChannelsOverview />
	</EngagementDashboardCard>
);

export default ChannelsTab;
