import type { ReactNode, Ref } from 'react';

import type { BackgroundEffect } from '../devices/BackgroundEffectContext';

export type EffectEntry = {
	key: string;
	label: string;
	thumbnail: ReactNode;
	/** Absent on "Custom…", which asks for a picture instead. */
	effect?: BackgroundEffect;
	note?: string;
	disabled?: boolean;
	onRemove?: () => void;
	tileRef?: Ref<HTMLDivElement>;
};

export type EffectEntryGroup = { key: string; title: string; entries: EffectEntry[] };

export const CUSTOM_KEY = 'custom';

export const effectKey = (effect: BackgroundEffect): string => {
	switch (effect.kind) {
		case 'blur':
			return `blur:${effect.level}`;
		case 'preset':
			return `preset:${effect.id}`;
		case 'image':
			return `image:${effect.id}`;
		default:
			return effect.kind;
	}
};
