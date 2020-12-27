import { action } from '@storybook/addon-actions';
import React from 'react';

import BurgerMenuButton from './BurgerMenuButton';

export default {
	title: 'components/burger/BurgerMenuButton',
	component: BurgerMenuButton,
};

export const Basic = () =>
	<BurgerMenuButton onClick={action('click')} />;

export const Open = () =>
	<BurgerMenuButton open onClick={action('click')} />;

export const WithBadge = () =>
	<BurgerMenuButton badge='99' onClick={action('click')} />;
