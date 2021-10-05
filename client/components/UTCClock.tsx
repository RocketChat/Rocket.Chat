import React, { memo, ReactElement } from 'react';

import { useUTCClock } from '../hooks/useUTCClock';

type UTCClockProps = {
	utcOffset: number;
};

const UTCClock = ({ utcOffset }: UTCClockProps): ReactElement => <>{useUTCClock(utcOffset)}</>;

export default memo(UTCClock);
