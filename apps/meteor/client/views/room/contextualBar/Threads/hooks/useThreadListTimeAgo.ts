import { useTimeAgo } from '@rocket.chat/ui-client';

/** Formats a date for a list of threads, with the short weekday and date forms that fit its narrow rows. */
export const useThreadListTimeAgo = () => useTimeAgo({ dateFormat: 'll', weekdayFormat: 'ddd' });
