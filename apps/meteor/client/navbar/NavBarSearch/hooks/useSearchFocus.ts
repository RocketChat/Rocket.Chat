import type { OverlayTriggerState } from '@react-stately/overlays';
import { useLayout } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect } from 'react';

export const useSearchFocus = (state: OverlayTriggerState) => {
	const { navbar } = useLayout();

	useEffect(() => {
		if (!state.isOpen) {
			navbar.collapseSearch?.();
		}
	}, [navbar, state.isOpen]);

	const handleFocus = useCallback(() => {
		navbar.expandSearch?.();
		state.setOpen(true);
	}, [navbar, state]);

	return handleFocus;
};
