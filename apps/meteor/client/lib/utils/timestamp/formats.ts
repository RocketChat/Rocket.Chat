import type { TimestampFormat, ITimestampFormatConfig } from './types';

export const TIMESTAMP_FORMATS: Record<TimestampFormat, ITimestampFormatConfig> = {
	t: {
		label: 'timestamps.shortTime',
		format: 'p',
		description: 'timestamps.shortTimeDescription',
	},
	T: {
		label: 'timestamps.longTime',
		format: 'pp',
		description: 'timestamps.longTimeDescription',
	},
	d: {
		label: 'timestamps.shortDate',
		format: 'P',
		description: 'timestamps.shortDateDescription',
	},
	D: {
		label: 'timestamps.longDate',
		format: 'Pp',
		description: 'timestamps.longDateDescription',
	},
	f: {
		label: 'timestamps.fullDateTime',
		format: 'PPPppp',
		description: 'timestamps.fullDateTimeDescription',
	},
	F: {
		label: 'timestamps.fullDateTimeLong',
		format: 'PPPPpppp',
		description: 'timestamps.fullDateTimeLongDescription',
	},
	R: {
		label: 'timestamps.relativeTime',
		format: 'relative',
		description: 'timestamps.relativeTimeDescription',
	},
};
