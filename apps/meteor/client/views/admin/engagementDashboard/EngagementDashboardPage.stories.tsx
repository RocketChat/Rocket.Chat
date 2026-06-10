import type { StoryObj, Meta } from '@storybook/react';

import EngagementDashboardPage from './EngagementDashboardPage';

export default {
	component: EngagementDashboardPage,
	decorators: [(fn) => <div style={{ height: '100vh' }}>{fn()}</div>],
} satisfies Meta<typeof EngagementDashboardPage>;

export const Default: StoryObj<typeof EngagementDashboardPage> = {
	render: () => <EngagementDashboardPage tab='users' />,
	name: 'EngagementDashboardPage',
};
