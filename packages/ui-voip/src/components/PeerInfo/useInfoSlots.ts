import type { Keys as IconNames } from '@rocket.chat/icons';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { ConnectionState } from '../../context';

export type Slot = {
	text: string;
	type: 'warning' | 'info';
	icon?: IconNames;
};

const getMutedSlot = (muted: boolean, t: ReturnType<typeof useTranslation>['t']) => {
	if (muted) {
		return {
			text: t('Muted'),
			type: 'warning',
		} as const;
	}
	return undefined;
};

const getHeldSlot = (held: boolean, t: ReturnType<typeof useTranslation>['t']) => {
	if (held) {
		return {
			text: t('On_Hold'),
			type: 'info',
		} as const;
	}
	return undefined;
};

const getConnectionStateSlot = (connectionState: ConnectionState, t: ReturnType<typeof useTranslation>['t']) => {
	if (connectionState === 'RECONNECTING') {
		return {
			text: t('meteor_status_connecting'),
			type: 'warning',
			icon: 'warning',
		} as const;
	}
	return undefined;
};

export const useInfoSlots = (muted: boolean, held: boolean, connectionState?: ConnectionState): Slot[] => {
	const { t } = useTranslation();

	return useMemo(() => {
		const connectionStateSlot = connectionState ? getConnectionStateSlot(connectionState, t) : undefined;

		if (connectionStateSlot) {
			return [connectionStateSlot];
		}

		const slots: Slot[] = [];
		const heldSlot = getHeldSlot(held, t);
		const mutedSlot = getMutedSlot(muted, t);

		if (heldSlot) {
			slots.push(heldSlot);
		}
		if (mutedSlot) {
			slots.push(mutedSlot);
		}
		return slots;
	}, [muted, held, t, connectionState]);
};
