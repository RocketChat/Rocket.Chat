import moment from 'moment';
import { useCallback } from 'react';

export const useTimeFromNow = (withSuffix: boolean) =>
	useCallback((date?: Date | string) => moment(date).fromNow(!withSuffix), [withSuffix]);
