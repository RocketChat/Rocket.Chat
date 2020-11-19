import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import BurgerBadge from './BurgerBadge';
import { centeredDecorator } from '../../../.storybook/decorators';

export default {
	title: 'components/burger/BurgerBadge',
	component: BurgerBadge,
	decorators: [
		(storyFn) => <Box size='x24' borderWidth='x1' borderStyle='dashed' position='relative'>
			{storyFn()}
		</Box>,
		centeredDecorator,
	],
};

export const Basic = () =>
	<BurgerBadge>
		99
	</BurgerBadge>;
