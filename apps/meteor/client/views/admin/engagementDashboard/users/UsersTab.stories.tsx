import { Margins } from '@rocket.chat/fuselage';
import type { Meta, StoryFn } from '@storybook/react';
import type { ReactElement } from 'react';

import UsersTab from './UsersTab';

export default {
	title: 'Enterprise/Admin/Engagement Dashboard/UsersTab',
	component: UsersTab,
	decorators: [(fn): ReactElement => <Margins children={fn()} all='x24' />],
} satisfies Meta<typeof UsersTab>;

export const Default: StoryFn<typeof UsersTab> = () => <UsersTab timezone='utc' />;
Default.storyName = 'UsersTab';
