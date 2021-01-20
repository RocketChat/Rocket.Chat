import { useMemo } from 'react';
import moment from 'moment-timezone';

export const useTimezoneNameList = () => useMemo(() => moment.tz.names(), []);
