import { useCallback } from 'react';

import { formatFromNow } from '../lib/utils/dateFormat';

export const useTimeFromNow = (withSuffix: boolean) =>
	useCallback((date?: Date | string) => formatFromNow(date ?? new Date(), withSuffix), [withSuffix]);
