import React from 'react';

import { useTimezoneTime } from '../../hooks/useTimezoneTime';

export const UTCClock = React.memo(({ utcOffset }) => {
	const time = useTimezoneTime(utcOffset, 10000);
	return `${ time } UTC (${ utcOffset })`;
});

export default UTCClock;
