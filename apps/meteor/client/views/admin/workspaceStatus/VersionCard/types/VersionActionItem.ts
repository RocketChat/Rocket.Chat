import type { Keys } from '@rocket.chat/icons';
import type { ReactElement } from 'react';

export type VersionActionItem = {
	type: 'danger' | 'neutral';
	icon: Keys;
	label: ReactElement;
};
