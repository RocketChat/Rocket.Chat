import { usePeekMediaSessionState, useWidgetExternalControls } from '@rocket.chat/ui-voip';
import { useCallback } from 'react';

export const useContactCall = () => {
	const state = usePeekMediaSessionState();
	const { toggleWidget } = useWidgetExternalControls();

	const call = useCallback((number: string) => toggleWidget({ number }), [toggleWidget]);

	return { canCall: state !== 'unavailable', call };
};
