import type { Meta, StoryFn } from '@storybook/react';

import AddUsers from './AddUsers';
import { Contextualbar } from '../../../../../components/Contextualbar';

export default {
	title: 'Room/Contextual Bar/RoomMembers/AddUsers',
	component: AddUsers,
	parameters: {
		layout: 'fullscreen',
		actions: { argTypesRegex: '^on.*' },
	},
	decorators: [(fn) => <Contextualbar height='100vh'>{fn()}</Contextualbar>],
} satisfies Meta<typeof AddUsers>;

export const Default: StoryFn<typeof AddUsers> = (args) => <AddUsers {...args} />;
Default.storyName = 'AddUsers';
