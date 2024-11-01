import moment from 'moment';
import { useCallback } from 'react';

export const useTimeFromNow = (withSuffix: boolean): ((date?: Date | string) => string) =>
	useCallback((date) => moment(date).fromNow(!withSuffix), [withSuffix]);
