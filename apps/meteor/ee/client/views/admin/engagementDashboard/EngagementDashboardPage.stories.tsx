import { Meta, Story } from '@storybook/react';
import React, { ReactElement } from 'react';

import EngagementDashboardPage from './EngagementDashboardPage';

export default {
	title: 'Enterprise/Admin/Engagement Dashboard/EngagementDashboardPage',
	component: EngagementDashboardPage,
	decorators: [(fn): ReactElement => <div children={fn()} style={{ height: '100vh' }} />],
} as Meta;

export const Default: Story = () => <EngagementDashboardPage tab='users' />;
Default.storyName = 'EngagementDashboardPage';
