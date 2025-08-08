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
	title: 'Timestamp/TimestampPicker',
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

// DatePicker test
export const DatePickerDefault: StoryFn<typeof DatePicker> = () => (
	<DatePicker value={new Date('2025-07-25')} onChange={action('date-change')} />
);

export const DatePickerDifferentDates: StoryFn<typeof DatePicker> = () => (
	<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
		<DatePicker value={new Date('2024-01-01')} onChange={action('date-2024-01-01')} />
		<DatePicker value={new Date('2025-12-31')} onChange={action('date-2025-12-31')} />
		<DatePicker value={new Date('2026-06-30')} onChange={action('date-2026-06-30')} />
	</div>
);

// TimePicker test
export const TimePickerDefault: StoryFn<typeof TimePicker> = () => (
	<TimePicker value={new Date('2025-07-25T09:30:00')} onChange={action('time-9:30-AM')} />
);

export const TimePickerDifferentTimes: StoryFn<typeof TimePicker> = () => (
	<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
		<TimePicker value={new Date('2025-07-25T07:30:00')} onChange={action('time-7:30-AM')} />
		<TimePicker value={new Date('2025-07-25T14:30:00')} onChange={action('time-2:30-PM')} />
		<TimePicker value={new Date('2025-07-25T00:00:00')} onChange={action('time-12:00-AM')} />
		<TimePicker value={new Date('2025-07-25T12:00:00')} onChange={action('time-12:00-PM')} />
	</div>
);

// FormatSelector test
export const FormatSelectorDefault: StoryFn<typeof FormatSelector> = () => <FormatSelector value='f' onChange={action('format-change')} />;

export const FormatSelectorAllFormats: StoryFn<typeof FormatSelector> = () => (
	<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
		<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
			<FormatSelector value='t' onChange={action('format-t-short-time')} />
			<FormatSelector value='T' onChange={action('format-T-long-time')} />
			<FormatSelector value='d' onChange={action('format-d-short-date')} />
			<FormatSelector value='D' onChange={action('format-D-long-date')} />
			<FormatSelector value='f' onChange={action('format-f-full-datetime')} />
			<FormatSelector value='F' onChange={action('format-F-full-datetime-long')} />
			<FormatSelector value='R' onChange={action('format-R-relative-time')} />
		</div>
	</div>
);

// Preview test
export const PreviewDefault: StoryFn<typeof Preview> = () => (
	<Preview date={new Date('2025-07-25T10:30:00Z')} format='f' timezone='UTC+8' />
);

export const PreviewAllFormats: StoryFn<typeof Preview> = () => {
	const testDate = new Date('2025-07-25T10:30:00Z');
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
			<Preview date={testDate} format='t' timezone='UTC' />
			<Preview date={testDate} format='T' timezone='UTC' />
			<Preview date={testDate} format='d' timezone='UTC' />
			<Preview date={testDate} format='D' timezone='UTC' />
			<Preview date={testDate} format='f' timezone='UTC' />
			<Preview date={testDate} format='F' timezone='UTC' />
			<Preview date={testDate} format='R' timezone='UTC' />
		</div>
	);
};

export const PreviewWithTimezones: StoryFn<typeof Preview> = () => {
	const testDate = new Date('2024-03-15T10:30:00Z');
	return (
		<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
			<Preview date={testDate} format='f' timezone='local' />
			<Preview date={testDate} format='f' timezone='UTC' />
			<Preview date={testDate} format='f' timezone='UTC+8' />
			<Preview date={testDate} format='f' timezone='UTC-5' />
			<Preview date={testDate} format='f' timezone='UTC+12' />
			<Preview date={testDate} format='f' timezone='UTC-12' />
		</div>
	);
};

// TimezoneSelector test
export const TimezoneSelectorDefault: StoryFn<typeof TimezoneSelector> = () => (
	<TimezoneSelector value='local' onChange={action('timezone-change')} />
);

export const TimezoneSelectorVariations: StoryFn<typeof TimezoneSelector> = () => (
	<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
		<TimezoneSelector value='local' onChange={action('timezone-local')} />
		<TimezoneSelector value='UTC' onChange={action('timezone-utc')} />
		<TimezoneSelector value='UTC-12' onChange={action('timezone-utc-minus-12')} />
		<TimezoneSelector value='UTC+12' onChange={action('timezone-utc-plus-12')} />
		<TimezoneSelector value='UTC+8' onChange={action('timezone-utc-plus-8')} />
		<TimezoneSelector value='UTC-5' onChange={action('timezone-utc-minus-5')} />
	</div>
);

export const ComponentShowcase = () => (
	<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', padding: '16px' }}>
		<div>
			<h3>Date & Time Selection</h3>
			<DatePicker value={new Date('2025-03-15')} onChange={action('showcase-date')} />
			<TimePicker value={new Date('2025-03-15T14:30:00')} onChange={action('showcase-time')} />
		</div>
		<div>
			<h3>Format & Timezone</h3>
			<FormatSelector value='f' onChange={action('showcase-format')} />
			<TimezoneSelector value='UTC+8' onChange={action('showcase-timezone')} />
		</div>
	</div>
);
