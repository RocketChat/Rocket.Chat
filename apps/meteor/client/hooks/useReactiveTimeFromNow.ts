import { useLanguage } from '@rocket.chat/ui-contexts';
import { useEffect, useState } from 'react';

import type { DateInput } from '../lib/utils/dateFormat';
import { formatFromNow } from '../lib/utils/dateFormat';

const getRefreshInterval = (elapsedMs: number): number => {
	const distance = Math.abs(elapsedMs);

	if (distance < 60000) {
		return 1000;
	}

	if (distance < 3600000) {
		return 30000;
	}

	if (distance < 86400000) {
		return 300000;
	}

	return 3600000;
};

export const useReactiveTimeFromNow = (date: DateInput | undefined, withSuffix = true): string | undefined => {
	const language = useLanguage();

	const timestamp = date !== undefined ? new Date(date).getTime() : undefined;
	const time = timestamp !== undefined && !Number.isNaN(timestamp) ? timestamp : undefined;

	const [text, setText] = useState(() => (time !== undefined ? formatFromNow(time, withSuffix) : undefined));

	useEffect(() => {
		if (time === undefined) {
			setText(undefined);
			return;
		}

		let timeoutId: ReturnType<typeof setTimeout>;

		const refresh = () => {
			setText(formatFromNow(time, withSuffix));
			timeoutId = setTimeout(refresh, getRefreshInterval(Date.now() - time));
		};

		refresh();

		return () => clearTimeout(timeoutId);
	}, [time, withSuffix, language]);

	return text;
};
