import React from 'react';

import { useAutoToggle } from '../../../.storybook/hooks';
import BurgerIcon from './BurgerIcon';

export default {
	title: 'components/burger/BurgerIcon',
	component: BurgerIcon,
};

export const Normal = () =>
	<BurgerIcon />;

export const Open = () =>
	<BurgerIcon open />;

export const Transitioning = () =>
	<BurgerIcon open={useAutoToggle()} />;
