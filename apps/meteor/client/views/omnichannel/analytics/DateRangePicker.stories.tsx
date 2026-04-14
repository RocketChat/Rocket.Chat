import type { Meta, StoryFn } from '@storybook/react';

import DateRangePicker from './DateRangePicker';

export default {
	component: DateRangePicker,
	parameters: {
		layout: 'centered',
		controls: { hideNoControlsWarning: true },
		actions: { argTypesRegex: '^on.*' },
	},
} satisfies Meta<typeof DateRangePicker>;

export const Default: StoryFn<typeof DateRangePicker> = (args) => <DateRangePicker {...args} />;
Default.storyName = 'DateRangePicker';
