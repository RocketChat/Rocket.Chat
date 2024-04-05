import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import type { KeyboardEvent, MouseEvent } from 'react';

export const usePreventPropagation = (fn?: (e: MouseEvent | KeyboardEvent) => void): ((e: MouseEvent | KeyboardEvent) => void) => {
	const preventClickPropagation = useMutableCallback((e): void => {
		e.stopPropagation();
		fn?.(e);
	});
	return preventClickPropagation;
};
