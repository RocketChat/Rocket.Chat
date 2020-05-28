import { action } from '@storybook/addon-actions';
import React from 'react';

import { centeredDecorator } from '../../../../.storybook/decorators';
import BurgerMenuButton from './BurgerMenuButton';

export default {
	title: 'components/basic/burger/BurgerMenuButton',
	component: BurgerMenuButton,
	decorators: [
		centeredDecorator,
	],
};

export const Basic = () =>
	<BurgerMenuButton onClick={action('click')} />;

export const Open = () =>
	<BurgerMenuButton open onClick={action('click')} />;

export const WithBadge = () =>
	<BurgerMenuButton badge='99' onClick={action('click')} />;
