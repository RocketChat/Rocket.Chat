import { action } from '@storybook/addon-actions';
import { Story } from '@storybook/react';
import React from 'react';

import { centeredDecorator } from '../../../.storybook/decorators';
import BurgerMenuButton from './BurgerMenuButton';

export default {
	title: 'components/burger/BurgerMenuButton',
	component: BurgerMenuButton,
	decorators: [centeredDecorator],
};

export const Basic: Story = () => <BurgerMenuButton onClick={action('click')} />;

export const Open: Story = () => <BurgerMenuButton open onClick={action('click')} />;

export const WithBadge: Story = () => <BurgerMenuButton badge={99} onClick={action('click')} />;
