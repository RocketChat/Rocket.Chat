import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import BurgerBadge from './BurgerBadge';

export default {
	title: 'components/burger/BurgerBadge',
	component: BurgerBadge,
	decorators: [
		(storyFn) => <Box size='x24' position='relative'>
			{storyFn()}
		</Box>,
	],
};

export const _BurgerBadge = () =>
	<BurgerBadge>
		99
	</BurgerBadge>;
_BurgerBadge.storyName = 'BurgerBadge';
