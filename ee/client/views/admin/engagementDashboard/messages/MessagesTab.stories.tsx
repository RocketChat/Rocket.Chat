import { Margins } from '@rocket.chat/fuselage';
import { Meta, Story } from '@storybook/react';
import React, { ReactElement } from 'react';

import MessagesTab from './MessagesTab';

export default {
	title: 'admin/engagementDashboard/MessagesTab',
	component: MessagesTab,
	decorators: [(fn): ReactElement => <Margins children={fn()} all='x24' />],
} as Meta;

export const Default: Story = () => <MessagesTab />;
Default.storyName = 'MessagesTab';
