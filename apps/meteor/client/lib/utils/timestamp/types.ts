export type TimestampFormat = 't' | 'T' | 'd' | 'D' | 'f' | 'F' | 'R';

export interface ITimestampFormatConfig {
	label: string;
	format: string;
	description: string;
}

export interface ITimezoneConfig {
	label: string;
	description: string;
	offset: string;
}

export type TimezoneKey = string;
