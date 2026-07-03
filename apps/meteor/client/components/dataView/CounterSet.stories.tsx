import type { StoryObj, Meta } from '@storybook/react';

import CounterSet from './CounterSet';

export default {
	component: CounterSet,
	parameters: {
		layout: 'padded',
		controls: { hideNoControlsWarning: true },
	},
} satisfies Meta<typeof CounterSet>;

export const Default: StoryObj<typeof CounterSet> = {
	name: 'CounterSet',

	args: {
		counters: [
			{ count: 123, variation: 0 },
			{ count: 456, variation: 7 },
			{ count: 789, variation: -1, description: 'Description' },
		],
	},
};
