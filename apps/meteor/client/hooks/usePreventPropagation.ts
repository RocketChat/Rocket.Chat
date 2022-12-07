import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import type { MouseEvent } from 'react';

export const usePreventPropagation = (fn?: (e: MouseEvent) => void): ((e: MouseEvent) => void) => {
	const preventClickPropagation = useMutableCallback((e): void => {
		e.stopPropagation();
		fn?.(e);
	});
	return preventClickPropagation;
};
