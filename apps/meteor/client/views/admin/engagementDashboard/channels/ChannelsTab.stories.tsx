import { Margins } from '@rocket.chat/fuselage';
import type { Meta, StoryFn } from '@storybook/react';

import ChannelsTab from './ChannelsOverview';

export default {
	title: 'Enterprise/Admin/Engagement Dashboard/ChannelsTab',
	component: ChannelsTab,
	decorators: [(fn) => <Margins children={fn()} all='x24' />],
} satisfies Meta<typeof ChannelsTab>;

export const Default: StoryFn<typeof ChannelsTab> = () => <ChannelsTab />;
Default.storyName = 'ChannelsTab';
