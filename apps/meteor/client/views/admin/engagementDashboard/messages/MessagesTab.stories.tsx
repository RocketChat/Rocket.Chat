import { Margins } from '@rocket.chat/fuselage';
import type { StoryObj, Meta } from '@storybook/react';

import MessagesTab from './MessagesTab';

export default {
	component: MessagesTab,
	decorators: [(fn) => <Margins all='x24'>{fn()}</Margins>],
} satisfies Meta<typeof MessagesTab>;

export const Default: StoryObj<typeof MessagesTab> = {
	render: () => <MessagesTab timezone='utc' />,
	name: 'MessagesTab',
};
