import type { IContactPhone } from '@rocket.chat/core-typings';
import { usePeekMediaSessionState, useWidgetExternalControls } from '@rocket.chat/ui-voip';
import { useCallback } from 'react';

import { toDialableNumber } from '../lib/toDialableNumber';

type ContactCallPhone = Pick<IContactPhone, 'raw' | 'e164'>;

const isDialable = (phone: ContactCallPhone) => toDialableNumber(phone) !== undefined;

export const useContactCall = () => {
	const state = usePeekMediaSessionState();
	const { toggleWidget } = useWidgetExternalControls();

	const call = useCallback(
		(phone: ContactCallPhone) => {
			const number = toDialableNumber(phone);

			if (number === undefined) {
				return;
			}

			toggleWidget({ number });
		},
		[toggleWidget],
	);

	return { canCall: state === 'available', isCallInProgress: state !== 'available' && state !== 'unavailable', isDialable, call };
};
