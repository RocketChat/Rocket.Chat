import { Margins } from '@rocket.chat/fuselage';
import type { Meta, StoryFn } from '@storybook/react';

import ChannelsTab from './ChannelsOverview';

export default {
	component: ChannelsTab,
	decorators: [(fn) => <Margins all='x24'>{fn()}</Margins>],
} satisfies Meta<typeof ChannelsTab>;

export const Default: StoryFn<typeof ChannelsTab> = () => <ChannelsTab />;
Default.storyName = 'ChannelsTab';
