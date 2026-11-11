import { formatFromNow } from '@rocket.chat/ui-client';
import { useCallback } from 'react';

export const useTimeFromNow = (withSuffix: boolean) =>
	useCallback((date?: Date | string) => formatFromNow(date ?? new Date(), withSuffix), [withSuffix]);
