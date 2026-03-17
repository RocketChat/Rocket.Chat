import type { Meta, StoryFn } from '@storybook/react';
import type { ReactElement } from 'react';

import EngagementDashboardPage from './EngagementDashboardPage';

export default {
	component: EngagementDashboardPage,
	decorators: [(fn): ReactElement => <div style={{ height: '100vh' }}>{fn()}</div>],
} satisfies Meta<typeof EngagementDashboardPage>;

export const Default: StoryFn<typeof EngagementDashboardPage> = () => <EngagementDashboardPage tab='users' />;
Default.storyName = 'EngagementDashboardPage';
