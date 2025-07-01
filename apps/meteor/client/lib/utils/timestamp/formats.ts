import type { TimestampFormat, ITimestampFormatConfig } from './types';

export const TIMESTAMP_FORMATS: Record<TimestampFormat, ITimestampFormatConfig> = {
	t: {
		label: 'Short time',
		format: 'p',
		description: '12:00 AM',
	},
	T: {
		label: 'Long time',
		format: 'pp',
		description: '12:00:00 AM',
	},
	d: {
		label: 'Short date',
		format: 'P',
		description: '12/31/2020',
	},
	D: {
		label: 'Long date',
		format: 'Pp',
		description: 'Thursday, December 31, 2020',
	},
	f: {
		label: 'Full date and time',
		format: 'PPPppp',
		description: 'Thursday, December 31, 2020 12:00 AM',
	},
	F: {
		label: 'Full date and time (long)',
		format: 'PPPPpppp',
		description: 'Thursday, December 31, 2020 12:00:00 AM',
	},
	R: {
		label: 'Relative time',
		format: 'relative',
		description: '1 year ago',
	},
};
