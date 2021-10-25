import { Margins } from '@rocket.chat/fuselage';
import { Meta, Story } from '@storybook/react';
import React, { ReactElement } from 'react';

import ChannelsTab from './ChannelsTab';

export default {
	title: 'admin/engagementDashboard/ChannelsTab',
	component: ChannelsTab,
	decorators: [(fn): ReactElement => <Margins children={fn()} all='x24' />],
} as Meta;

export const Default: Story = () => <ChannelsTab />;
Default.storyName = 'ChannelsTab';
