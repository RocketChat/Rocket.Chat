import { action } from '@storybook/addon-actions';
import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import { useAutoSequence } from '../../stories/hooks/useAutoSequence';
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

export const Example: ComponentStory<typeof BurgerMenuButton> = () => {
	const { open, badge } = useAutoSequence([
		{},
		{ open: true },
		{},
		{ badge: 99 },
		{ open: true, badge: 99 },
		{ badge: 99 },
		{ open: true },
	] as const);

	return <BurgerMenuButton open={open} badge={badge} onClick={action('onClick')} />;
};

const Template: ComponentStory<typeof BurgerMenuButton> = (args) => <BurgerMenuButton {...args} />;

export const Clean = Template.bind({});

export const Open = Template.bind({});
Open.args = {
	open: true,
};

export const WithBadge = Template.bind({});
WithBadge.args = {
	badge: 99,
};
