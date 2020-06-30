import React from 'react';

import { centeredDecorator } from '../../../../.storybook/decorators';
import { useAutoToggle } from '../../../../.storybook/hooks';
import BurgerIcon from './BurgerIcon';

export default {
	title: 'components/basic/burger/BurgerIcon',
	component: BurgerIcon,
	decorators: [
		centeredDecorator,
	],
};

export const Normal = () =>
	<BurgerIcon />;

export const Open = () =>
	<BurgerIcon open />;

export const Transitioning = () =>
	<BurgerIcon open={useAutoToggle()} />;
