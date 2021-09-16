import { action } from '@storybook/addon-actions';
import React from 'react';

import { centeredDecorator } from '../../../.storybook/decorators';
import BurgerMenu from './BurgerMenu';

export default {
	title: 'components/burger/BurgerMenu',
	component: BurgerMenu,
	decorators: [centeredDecorator],
};

export const Basic = () => <BurgerMenu onClick={action('click')} />;

export const Open = () => <BurgerMenu open onClick={action('click')} />;

export const WithBadge = () => <BurgerMenu badge='99' onClick={action('click')} />;
