import React, { memo } from 'react';

import { useUTCClock } from '../hooks/useUTCClock';

const UTCClock = ({ utcOffset }) => <>{useUTCClock(utcOffset)}</>;

export default memo(UTCClock);
