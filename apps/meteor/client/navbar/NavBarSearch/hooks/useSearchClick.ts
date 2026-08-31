import type { OverlayTriggerState } from '@react-stately/overlays';
import { useCallback } from 'react';

export const useSearchClick = (state: OverlayTriggerState) => {
	const handleClick = useCallback(() => {
		if (state.isOpen) {
			return;
		}

		state.setOpen(true);
	}, [state]);

	return handleClick;
};
