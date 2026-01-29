export type TimestampFormat = 't' | 'T' | 'd' | 'D' | 'f' | 'F' | 'R';

export interface ITimestampFormatConfig {
	label: string;
	format: string;
	description: string;
}

export enum UTCOffsets {
	'UTC-12' = '-12:00',
	'UTC-11' = '-11:00',
	'UTC-10' = '-10:00',
	'UTC-9' = '-09:00',
	'UTC-8' = '-08:00',
	'UTC-7' = '-07:00',
	'UTC-6' = '-06:00',
	'UTC-5' = '-05:00',
	'UTC-4' = '-04:00',
	'UTC-3' = '-03:00',
	'UTC-2' = '-02:00',
	'UTC-1' = '-01:00',
	'UTC' = '+00:00',
	'UTC+1' = '+01:00',
	'UTC+2' = '+02:00',
	'UTC+3' = '+03:00',
	'UTC+4' = '+04:00',
	'UTC+5' = '+05:00',
	'UTC+6' = '+06:00',
	'UTC+7' = '+07:00',
	'UTC+8' = '+08:00',
	'UTC+9' = '+09:00',
	'UTC+10' = '+10:00',
	'UTC+11' = '+11:00',
	'UTC+12' = '+12:00',
}

export type TimezoneKey = keyof typeof UTCOffsets | 'local';
