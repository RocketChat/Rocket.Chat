import type { Meta, StoryFn } from '@storybook/react';

import Counter from './Counter';

export default {
	title: 'Components/Data/Counter',
	component: Counter,
	parameters: {
		layout: 'centered',
		controls: { hideNoControlsWarning: true },
	},
} satisfies Meta<typeof Counter>;

export const Example: StoryFn<typeof Counter> = () => <Counter count={740} variation={59} description='LDAP users' />;

const Template: StoryFn<typeof Counter> = (args) => <Counter {...args} />;

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
