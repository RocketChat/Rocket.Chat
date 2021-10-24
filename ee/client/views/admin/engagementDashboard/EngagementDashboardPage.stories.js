import React from 'react';

import { EngagementDashboardPage } from './EngagementDashboardPage';

export default {
	title: 'admin/engagementDashboard/EngagementDashboardPage',
	component: EngagementDashboardPage,
	decorators: [(fn) => <div children={fn()} style={{ height: '100vh' }} />],
};

export const _default = () => <EngagementDashboardPage />;
