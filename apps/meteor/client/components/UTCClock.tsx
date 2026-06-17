import { memo } from 'react';

import { useUTCClock } from '../hooks/useUTCClock';

type UTCClockProps = {
	utcOffset: number;
};

const UTCClock = ({ utcOffset }: UTCClockProps) => {
	const time = useUTCClock(utcOffset);

	return <>{time}</>;
};

export default memo(UTCClock);
