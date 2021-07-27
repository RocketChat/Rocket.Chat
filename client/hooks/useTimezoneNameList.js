import moment from 'moment-timezone';
import { useMemo } from 'react';

export const useTimezoneNameList = () => useMemo(() => moment.tz.names(), []);
