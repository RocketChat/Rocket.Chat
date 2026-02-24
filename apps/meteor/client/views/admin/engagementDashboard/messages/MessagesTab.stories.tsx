import { Margins } from '@rocket.chat/fuselage';
import type { Meta, StoryFn } from '@storybook/react';

import MessagesTab from './MessagesTab';

export default {
	component: MessagesTab,
	decorators: [(fn) => <Margins all='x24'>{fn()}</Margins>],
} satisfies Meta<typeof MessagesTab>;

export const Default: StoryFn<typeof MessagesTab> = () => <MessagesTab timezone='utc' />;
Default.storyName = 'MessagesTab';
