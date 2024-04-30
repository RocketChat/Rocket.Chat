import { action } from '@storybook/addon-actions';
import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import BurgerMenuButton from './BurgerMenuButton';

export default {
	title: 'Components/Burger Menu/BurgerMenuButton',
	component: BurgerMenuButton,
	parameters: {
		layout: 'centered',
		controls: { hideNoControlsWarning: true },
		actions: { argTypesRegex: '^on.*' },
	},
} as ComponentMeta<typeof BurgerMenuButton>;

export const Example: ComponentStory<typeof BurgerMenuButton> = () => <BurgerMenuButton onClick={action('onClick')} />;

const Template: ComponentStory<typeof BurgerMenuButton> = (args) => <BurgerMenuButton {...args} />;

export const Default = Template.bind({});
export const WithBadge = Template.bind({});
WithBadge.args = {
	badge: 99,
};
