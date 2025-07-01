import type { IMessage } from '@rocket.chat/core-typings';

export type TimestampFormat = 't' | 'T' | 'd' | 'D' | 'f' | 'F' | 'R';

export interface ITimestampValue {
	timestamp: string;
	format: TimestampFormat;
}

export interface ITimestampFormatConfig {
	label: string;
	format: string;
	description: string;
}

export interface ITimestampPreview {
	formatted: string;
	raw: string;
}

export interface IMessageWithHTML extends IMessage {
	html?: string;
}
