import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import { Contextualbar } from '../../../../../components/Contextualbar';
import AddUsers from './AddUsers';

export default {
	title: 'Room/Contextual Bar/RoomMembers/AddUsers',
	component: AddUsers,
	parameters: {
		layout: 'fullscreen',
		actions: { argTypesRegex: '^on.*' },
	},
	decorators: [(fn) => <Contextualbar height='100vh'>{fn()}</Contextualbar>],
} as ComponentMeta<typeof AddUsers>;

export const Default: ComponentStory<typeof AddUsers> = (args) => <AddUsers {...args} />;
Default.storyName = 'AddUsers';
