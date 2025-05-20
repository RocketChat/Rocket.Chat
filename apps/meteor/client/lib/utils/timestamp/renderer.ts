import { formatTimestamp, parseTimestampMarkup, timestampToDate } from './conversion';
import type { TimestampValue } from './types';
import { isValidTimestamp, isValidTimestampMarkup } from './validation';
import { TIMESTAMP_REGEX } from './constants';

export const renderTimestamp = (html: string): string => {
    return html.replace(TIMESTAMP_REGEX, (match: string) => {
        try {
            if (!isValidTimestampMarkup(match)) {
                return match;
            }
            const timestampValue: TimestampValue | null = parseTimestampMarkup(match);
            if (!timestampValue || !isValidTimestamp(timestampValue.timestamp)) {
                return match;
            }
            const date = timestampToDate(timestampValue.timestamp);
            return formatTimestamp(date, timestampValue.format);
        } catch (error) {
            console.error('Error rendering timestamp:', error);
            return match;
        }
    });
};