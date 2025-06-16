import type { Meta, StoryFn } from '@storybook/react';

import CounterSet from './CounterSet';

export default {
	title: 'Components/Data/CounterSet',
	component: CounterSet,
	parameters: {
		layout: 'padded',
		controls: { hideNoControlsWarning: true },
	},
} satisfies Meta<typeof CounterSet>;

export const Default: StoryFn<typeof CounterSet> = (args) => <CounterSet {...args} />;
Default.storyName = 'CounterSet';
Default.args = {
	counters: [
		{ count: 123, variation: 0 },
		{ count: 456, variation: 7 },
		{ count: 789, variation: -1, description: 'Description' },
	],
};
