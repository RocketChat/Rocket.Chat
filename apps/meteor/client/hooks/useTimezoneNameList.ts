import moment from 'moment-timezone';
import { useMemo } from 'react';

export const useTimezoneNameList = (): string[] => useMemo(() => moment.tz.names(), []);
