import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export type Slot = {
	text: string;
	type: 'warning' | 'info';
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
			text: t('On hold'),
			type: 'info',
		} as const;
	}
	return undefined;
};

export const useInfoSlots = (muted: boolean, held: boolean): Slot[] => {
	const { t } = useTranslation();
	const [slots, setSlots] = useState<Slot[]>([]);

	useEffect(() => {
		const slots: Slot[] = [];
		const heldSlot = getHeldSlot(held, t);
		const mutedSlot = getMutedSlot(muted, t);
		if (heldSlot) {
			slots.push(heldSlot);
		}
		if (mutedSlot) {
			slots.push(mutedSlot);
		}
		setSlots(slots);
	}, [muted, held, t]);

	return slots;
};
