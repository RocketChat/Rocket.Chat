import { Margins } from '@rocket.chat/fuselage';
import type { Meta, Story } from '@storybook/react';
import type { ReactElement } from 'react';
import React from 'react';

import UsersTab from './UsersTab';

export default {
	title: 'Enterprise/Admin/Engagement Dashboard/UsersTab',
	component: UsersTab,
	decorators: [(fn): ReactElement => <Margins children={fn()} all='x24' />],
} as Meta;

export const Default: Story = () => <UsersTab timezone='utc' />;
Default.storyName = 'UsersTab';
