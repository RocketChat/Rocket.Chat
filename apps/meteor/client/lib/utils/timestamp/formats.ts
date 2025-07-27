import type { TimestampFormat, ITimestampFormatConfig } from './types';

export const TIMESTAMP_FORMATS: Record<TimestampFormat, ITimestampFormatConfig> = {
	t: {
		label: 'timestamps.shortTime',
		format: 'p',
		description: '12:00 AM',
	},
	T: {
		label: 'timestamps.longTime',
		format: 'pp',
		description: '12:00:00 AM',
	},
	d: {
		label: 'timestamps.shortDate',
		format: 'P',
		description: '12/31/2020',
	},
	D: {
		label: 'timestamps.longDate',
		format: 'Pp',
		description: '12/31/2020, 12:00 AM',
	},
	f: {
		label: 'timestamps.fullDateTime',
		format: 'PPPppp',
		description: 'December 31, 2020 12:00 AM',
	},
	F: {
		label: 'timestamps.fullDateTimeLong',
		format: 'PPPPpppp',
		description: 'Thursday, December 31, 2020 12:00:00 AM',
	},
	R: {
		label: 'timestamps.relativeTime',
		format: 'relative',
		description: '1 year ago',
	},
};
