import { Box } from '@rocket.chat/fuselage';
import type { ComponentMeta, ComponentStory } from '@storybook/react';
import type { ReactElement } from 'react';
import React from 'react';

import BurgerBadge from './BurgerBadge';

export default {
	title: 'Components/Burger Menu/BurgerBadge',
	component: BurgerBadge,
	parameters: {
		layout: 'centered',
	},
	decorators: [
		(fn): ReactElement => (
			<Box size='x24' backgroundColor='neutral' position='relative'>
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
