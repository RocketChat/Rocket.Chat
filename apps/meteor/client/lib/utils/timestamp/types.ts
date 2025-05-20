
import type { IMessage } from '@rocket.chat/core-typings';


export type TimestampFormat = 't' | 'T' | 'd' | 'D' | 'f' | 'F' | 'R';

export interface TimestampValue {
  timestamp: string;
  format: TimestampFormat;
}

export interface TimestampFormatConfig {
  label: string;
  format: string;
  description: string;
}

export interface TimestampPreview {
  formatted: string;
  raw: string;
} 

export interface IMessageWithHTML extends IMessage {
  html?: string;
} 