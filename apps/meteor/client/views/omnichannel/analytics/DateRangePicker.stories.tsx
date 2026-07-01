import type { StoryObj, Meta } from '@storybook/react';

import DateRangePicker from './DateRangePicker';

export default {
	component: DateRangePicker,
	parameters: {
		layout: 'centered',
		controls: { hideNoControlsWarning: true },
		actions: { argTypesRegex: '^on.*' },
	},
} satisfies Meta<typeof DateRangePicker>;

export const Default: StoryObj<typeof DateRangePicker> = {
	name: 'DateRangePicker',
};
