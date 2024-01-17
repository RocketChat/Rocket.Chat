import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import Counter from './Counter';

export default {
	title: 'Components/Data/Counter',
	component: Counter,
	parameters: {
		layout: 'centered',
		controls: { hideNoControlsWarning: true },
	},
} as ComponentMeta<typeof Counter>;

export const Example: ComponentStory<typeof Counter> = () => <Counter count={740} variation={59} description='LDAP users' />;

const Template: ComponentStory<typeof Counter> = (args) => <Counter {...args} />;

export const WithoutVariation = Template.bind({});
WithoutVariation.args = {
	count: 123,
};

export const WithPositiveVariation = Template.bind({});
WithPositiveVariation.args = {
	count: 123,
	variation: 4,
};

export const WithNegativeVariation = Template.bind({});
WithNegativeVariation.args = {
	count: 123,
	variation: -4,
};

export const WithDescription = Template.bind({});
WithDescription.args = {
	count: 123,
	description: 'Description',
};
