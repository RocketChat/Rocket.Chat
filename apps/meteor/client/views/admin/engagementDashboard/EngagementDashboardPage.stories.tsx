import type { Meta, StoryFn } from '@storybook/react';
import type { ReactElement } from 'react';

import EngagementDashboardPage from './EngagementDashboardPage';

export default {
	title: 'Enterprise/Admin/Engagement Dashboard/EngagementDashboardPage',
	component: EngagementDashboardPage,
	decorators: [(fn): ReactElement => <div children={fn()} style={{ height: '100vh' }} />],
} satisfies Meta<typeof EngagementDashboardPage>;

export const Default: StoryFn<typeof EngagementDashboardPage> = () => <EngagementDashboardPage tab='users' />;
Default.storyName = 'EngagementDashboardPage';
