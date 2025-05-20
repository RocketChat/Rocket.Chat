import { format } from 'date-fns';
import type { TimestampFormat, TimestampValue } from './types';
import { TIMESTAMP_FORMATS } from './formats';

/**
 * Converts a Date object to a Unix timestamp string
 */
export const dateToTimestamp = (date: Date): string => {
  return Math.floor(date.getTime() / 1000).toString();
};

/**
 * Converts a Unix timestamp string to a Date object
 */
export const timestampToDate = (timestamp: string): Date => {
  return new Date(parseInt(timestamp) * 1000);
};

/**
 * Formats a date according to the specified timestamp format
 */
export const formatTimestamp = (date: Date, formatType: TimestampFormat): string => {
  const config = TIMESTAMP_FORMATS[formatType];
  
  if (formatType === 'R') {
    return formatRelativeTime(date);
  }
  
  return format(date, config.format);
};

/**
 * Generates a timestamp markup string in the format <t:timestamp:format>
 */
export const generateTimestampMarkup = (timestamp: string, format: TimestampFormat): string => {
  return `<t:${timestamp}:${format}>`;
};

/**
 * Parses a timestamp markup string into a TimestampValue object
 */
export const parseTimestampMarkup = (markup: string): TimestampValue | null => {
  const match = markup.match(/<t:(\d+):?([tTdDfFR])?>/);
  if (!match) {
    return null;
  }
  
  return {
    timestamp: match[1],
    format: (match[2] || 't') as TimestampFormat
  };
};

/**
 * Formats a date as a relative time string
 */
const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  
  if (Math.abs(years) > 0) return `${years} year${Math.abs(years) === 1 ? '' : 's'} ago`;
  if (Math.abs(months) > 0) return `${months} month${Math.abs(months) === 1 ? '' : 's'} ago`;
  if (Math.abs(weeks) > 0) return `${weeks} week${Math.abs(weeks) === 1 ? '' : 's'} ago`;
  if (Math.abs(days) > 0) return `${days} day${Math.abs(days) === 1 ? '' : 's'} ago`;
  if (Math.abs(hours) > 0) return `${hours} hour${Math.abs(hours) === 1 ? '' : 's'} ago`;
  if (Math.abs(minutes) > 0) return `${minutes} minute${Math.abs(minutes) === 1 ? '' : 's'} ago`;
  return `${seconds} second${Math.abs(seconds) === 1 ? '' : 's'} ago`;
};