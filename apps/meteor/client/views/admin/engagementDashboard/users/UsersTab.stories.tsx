import { Margins } from '@rocket.chat/fuselage';
import type { Meta, StoryFn } from '@storybook/react';
import type { ReactElement } from 'react';

import UsersTab from './UsersTab';

export default {
	component: UsersTab,
	decorators: [(fn): ReactElement => <Margins all='x24'>{fn()}</Margins>],
} satisfies Meta<typeof UsersTab>;

export const Default: StoryFn<typeof UsersTab> = () => <UsersTab timezone='utc' />;
Default.storyName = 'UsersTab';
