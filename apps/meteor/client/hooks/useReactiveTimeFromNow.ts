import { useEffect, useReducer } from 'react';

import type { DateInput } from '../lib/utils/dateFormat';
import { formatFromNow } from '../lib/utils/dateFormat';

const getRefreshInterval = (elapsedMs: number): number => (Math.abs(elapsedMs) < 3600000 ? 30000 : 300000);

export const useReactiveTimeFromNow = (date: DateInput | undefined, withSuffix = true): string | undefined => {
	const parsed = date !== undefined ? new Date(date).getTime() : NaN;
	const time = Number.isNaN(parsed) ? undefined : parsed;

	const [, rerender] = useReducer((x) => x + 1, 0);

	useEffect(() => {
		if (time === undefined) {
			return undefined;
		}

		let timeoutId: ReturnType<typeof setTimeout>;

		const schedule = () => {
			timeoutId = setTimeout(
				() => {
					rerender();
					schedule();
				},
				getRefreshInterval(Date.now() - time),
			);
		};

		schedule();

		return () => clearTimeout(timeoutId);
	}, [time]);

	return time !== undefined ? formatFromNow(time, withSuffix) : undefined;
};
