import { Box } from '@rocket.chat/fuselage';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import React, { ReactElement } from 'react';

import BurgerBadge from './BurgerBadge';

export default {
	title: 'Components/Burger Menu/BurgerBadge',
	component: BurgerBadge,
	parameters: {
		layout: 'centered',
	},
	decorators: [
		(fn): ReactElement => (
			<Box size={24} backgroundColor='neutral-500' position='relative'>
				{fn()}
			</Box>
		),
	],
} as ComponentMeta<typeof BurgerBadge>;

export const Default: ComponentStory<typeof BurgerBadge> = (args) => <BurgerBadge {...args} />;
Default.storyName = 'BurgerBadge';
Default.args = {
	children: 99,
};
