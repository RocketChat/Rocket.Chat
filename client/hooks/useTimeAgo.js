import { useCallback } from 'react';
import moment from 'moment';

export const useTimeAgo = () => useCallback((time) => moment(time).calendar(null, { sameDay: 'LT', lastWeek: 'dddd LT', sameElse: 'LL' }), []);
