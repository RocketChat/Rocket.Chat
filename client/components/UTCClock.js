import React, { memo } from 'react';

import { useTranslation } from '../contexts/TranslationContext';
import { useTimezoneTime } from '../hooks/useTimezoneTime';

const useUTCClock = (utcOffset) => {
	const time = useTimezoneTime(utcOffset, 10000);
	return `${time} (UTC ${utcOffset})`;
};

export const UTCClock = memo(({ utcOffset }) => <>{useUTCClock(utcOffset)}</>);

export const LocalTime = memo(({ utcOffset }) => {
	const t = useTranslation();
	const time = useUTCClock(utcOffset);
	return <>{t('Local_Time_time', { time })}</>;
});
