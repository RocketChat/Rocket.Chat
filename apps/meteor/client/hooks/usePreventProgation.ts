import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { MouseEvent } from 'react';

export const usePreventProgation = (fn: (e: MouseEvent) => void): ((e: MouseEvent) => void) => {
	const preventClickPropagation = useMutableCallback((e): void => {
		e.stopPropagation();
		fn?.(e);
	});
	return preventClickPropagation;
};
