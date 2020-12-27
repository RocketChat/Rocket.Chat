import { memo } from 'react';

import { useUTCClock } from '../hooks/useUTCClock';

const UTCClock = ({ utcOffset }) => {
	const time = useUTCClock(utcOffset);

	return <>{time}</>;
};

export default memo(UTCClock);
