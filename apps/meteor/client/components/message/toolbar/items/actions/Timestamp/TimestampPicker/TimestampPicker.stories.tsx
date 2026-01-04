import { mockAppRoot } from '@rocket.chat/mock-providers';
import { action } from '@storybook/addon-actions';
import type { Meta, StoryFn } from '@storybook/react';

import DatePicker from './DatePicker';
import FormatSelector from './FormatSelector';
import Preview from './Preview';
import TimePicker from './TimePicker';
import { TimestampPickerModal } from './TimestampPickerModal';
import TimezoneSelector from './TimezoneSelector';

export default {
	component: TimestampPickerModal,
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
} satisfies Meta<typeof TimestampPickerModal>;

export const Default = () => <TimestampPickerModal onClose={action('onClose')} composer={{ insertText: action('insertText') } as any} />;

export const DatePickerDefault: StoryFn<typeof DatePicker> = () => (
	<DatePicker value={new Date('2025-07-25')} onChange={action('date-change')} />
);
