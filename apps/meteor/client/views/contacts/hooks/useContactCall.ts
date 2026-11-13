import type { IContactPhone } from '@rocket.chat/core-typings';
import { usePeekMediaSessionState, useWidgetExternalControls } from '@rocket.chat/ui-voip';
import { useCallback } from 'react';

import { toDialableNumber } from '../lib/toDialableNumber';

export const useContactCall = () => {
	const state = usePeekMediaSessionState();
	const { toggleWidget } = useWidgetExternalControls();

	const call = useCallback(
		(phone: Pick<IContactPhone, 'raw' | 'e164'>) => toggleWidget({ number: toDialableNumber(phone) }),
		[toggleWidget],
	);

	return { canCall: state === 'available', isCallInProgress: state !== 'available' && state !== 'unavailable', call };
};
