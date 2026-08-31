import { Margins } from '@rocket.chat/fuselage';
import type { StoryObj, Meta } from '@storybook/react';

import UsersTab from './UsersTab';

export default {
	component: UsersTab,
	decorators: [(fn) => <Margins all='x24'>{fn()}</Margins>],
} satisfies Meta<typeof UsersTab>;

export const Default: StoryObj<typeof UsersTab> = {
	render: () => <UsersTab timezone='utc' />,
	name: 'UsersTab',
};
