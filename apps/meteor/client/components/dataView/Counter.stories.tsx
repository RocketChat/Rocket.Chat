import type { Meta, StoryFn } from '@storybook/react';

import Counter from './Counter';

export default {
	component: Counter,
	parameters: {
		layout: 'centered',
		controls: { hideNoControlsWarning: true },
	},
} satisfies Meta<typeof Counter>;

export const Example: StoryFn<typeof Counter> = () => <Counter count={740} variation={59} description='LDAP users' />;

export const WithoutVariation = {
	args: {
		count: 123,
	},
};

export const WithPositiveVariation = {
	args: {
		count: 123,
		variation: 4,
	},
};

export const WithNegativeVariation = {
	args: {
		count: 123,
		variation: -4,
	},
};

export const WithDescription = {
	args: {
		count: 123,
		description: 'Description',
	},
};
