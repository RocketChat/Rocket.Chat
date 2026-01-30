import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { UIEvent } from 'react';

export const usePreventPropagation = (fn?: (e: UIEvent) => void): ((e: UIEvent) => void) => {
	const preventClickPropagation = useEffectEvent((e: UIEvent): void => {
		e.stopPropagation();
		fn?.(e);
	});
	return preventClickPropagation;
};
