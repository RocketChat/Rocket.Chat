import { mockAppRoot } from '@rocket.chat/mock-providers';
import { action } from '@storybook/addon-actions';
import type { Meta, StoryFn } from '@storybook/react';

import DatePicker from './DatePicker';
import FormatSelector from './FormatSelector';
import Preview from './Preview';
import TimePicker from './TimePicker';
import TimezoneSelector from './TimezoneSelector';
import { TimestampPicker } from './index';

export default {
	component: TimestampPicker,
	subcomponents: {
		DatePicker,
		TimePicker,
		FormatSelector,
		TimezoneSelector,
		Preview,
	},
	decorators: [mockAppRoot().buildStoryDecorator()],
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<typeof TimestampPicker>;

export const Default = () => <TimestampPicker onClose={action('onClose')} composer={{ insertText: action('insertText') } as any} />;

export const DatePickerDefault: StoryFn<typeof DatePicker> = () => (
	<DatePicker value={new Date('2025-07-25')} onChange={action('date-change')} />
);
