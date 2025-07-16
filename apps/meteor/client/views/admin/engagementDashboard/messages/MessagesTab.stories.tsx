import { Margins } from '@rocket.chat/fuselage';
import type { Meta, StoryFn } from '@storybook/react';

import MessagesTab from './MessagesTab';

export default {
	title: 'Enterprise/Admin/Engagement Dashboard/MessagesTab',
	component: MessagesTab,
	decorators: [(fn) => <Margins children={fn()} all='x24' />],
} satisfies Meta<typeof MessagesTab>;

export const Default: StoryFn<typeof MessagesTab> = () => <MessagesTab timezone='utc' />;
Default.storyName = 'MessagesTab';
