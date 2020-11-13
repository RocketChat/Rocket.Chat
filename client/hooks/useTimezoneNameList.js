import { useMemo } from 'react';

import { namesTimeZoneDate } from '../../lib/rocketchat-dates';

export const useTimezoneNameList = () => useMemo(() => namesTimeZoneDate(), []);
