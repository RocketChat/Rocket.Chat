import type { Icon } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { ComponentProps } from 'react';
import { createContext } from 'react';

export type LabelSelectOptionMeta = {
	icon: IconName;
	color?: ComponentProps<typeof Icon>['color'];
};

// Select options only carry a value and a text label, so the icon of each option travels through context.
export const LabelSelectOptionsContext = createContext<ReadonlyMap<string, LabelSelectOptionMeta>>(new Map());
