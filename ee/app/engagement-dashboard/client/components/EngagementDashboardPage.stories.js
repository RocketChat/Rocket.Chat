import React from 'react';

import { EngagementDashboardPage } from './EngagementDashboardPage';

export default {
	title: 'admin/enterprise/engagement/EngagementDashboardPage',
	component: EngagementDashboardPage,
	decorators: [(fn) => <div children={fn()} style={{ height: '100vh' }} />],
};

export const _default = () => <EngagementDashboardPage />;
