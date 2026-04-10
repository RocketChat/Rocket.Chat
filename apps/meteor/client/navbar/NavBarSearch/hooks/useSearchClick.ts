import { useCallback } from 'react';
import type { OverlayTriggerState } from '@react-stately/overlays';

export const useSearchClick = (state: OverlayTriggerState) => {
	const handleClick = useCallback(() => {
		if (state.isOpen) {
			return;
		}

		state.setOpen(true);
	}, [state]);

	return handleClick;
};
