import moment from 'moment';
import { useMemo } from 'react';

export const useFormattedRelativeTime = (timeMs: number): string =>
	useMemo(() => {
		moment.relativeTimeThreshold('s', 60);
		moment.relativeTimeThreshold('ss', 0);
		moment.relativeTimeThreshold('m', 60);
		moment.relativeTimeThreshold('h', 24);
		moment.relativeTimeThreshold('d', 31);
		moment.relativeTimeThreshold('M', 12);

		return moment.duration(timeMs).humanize();
	}, [timeMs]);
