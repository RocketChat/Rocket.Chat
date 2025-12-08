import { Contextualbar } from '@rocket.chat/ui-client';
import type { Meta, StoryFn } from '@storybook/react';

import AddUsers from './AddUsers';

export default {
	component: AddUsers,
	parameters: {
		layout: 'fullscreen',
		actions: { argTypesRegex: '^on.*' },
	},
	decorators: [(fn) => <Contextualbar height='100vh'>{fn()}</Contextualbar>],
} satisfies Meta<typeof AddUsers>;

export const Default: StoryFn<typeof AddUsers> = (args) => <AddUsers {...args} />;
Default.storyName = 'AddUsers';
