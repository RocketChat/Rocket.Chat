import React from 'react';

import { useTimezoneTime } from '../../hooks/useTimezoneTime';
import { useTranslation } from '../../contexts/TranslationContext';

const useUTCClock = (utcOffset) => {
	const time = useTimezoneTime(utcOffset, 10000);
	return `${ time } (UTC ${ utcOffset })`;
};

export const UTCClock = React.memo(({ utcOffset }) => useUTCClock(utcOffset));

export const LocalTime = React.memo(({ utcOffset }) => {
	const t = useTranslation();
	const time = useUTCClock(utcOffset);
	return t('Local_Time_time', { time });
});
