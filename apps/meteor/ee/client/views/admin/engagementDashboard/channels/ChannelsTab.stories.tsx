import { Margins } from '@rocket.chat/fuselage';
import { Meta, Story } from '@storybook/react';
import React from 'react';

import ChannelsTab from './ChannelsTab';

export default {
	title: 'Enterprise/Admin/Engagement Dashboard/ChannelsTab',
	component: ChannelsTab,
	decorators: [(fn) => <Margins children={fn()} all='x24' />],
} as Meta;

export const Default: Story = () => <ChannelsTab />;
Default.storyName = 'ChannelsTab';
