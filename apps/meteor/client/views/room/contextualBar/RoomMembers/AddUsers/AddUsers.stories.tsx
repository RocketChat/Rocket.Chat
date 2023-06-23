import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import { ContextualbarContainer } from '../../../../../components/Contextualbar';
import AddUsers from './AddUsers';

export default {
	title: 'Room/Contextual Bar/RoomMembers/AddUsers',
	component: AddUsers,
	parameters: {
		layout: 'fullscreen',
		actions: { argTypesRegex: '^on.*' },
	},
	decorators: [(fn) => <ContextualbarContainer height='100vh'>{fn()}</ContextualbarContainer>],
} as ComponentMeta<typeof AddUsers>;

export const Default: ComponentStory<typeof AddUsers> = (args) => <AddUsers {...args} />;
Default.storyName = 'AddUsers';
Default.args = {
	users: ['rocket.cat'],
};
