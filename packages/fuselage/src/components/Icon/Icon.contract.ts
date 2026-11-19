import type { Keys as IconName } from '@rocket.chat/icons';
import type { AriaAttributes, AriaRole } from 'react';

import type { statusColors, textIconColors } from '../../Theme';
import type { CommonAttributes } from '../../types/Attributes.contract';

type FontColor<T> = T extends `font-${infer Color}` ? Color : never;

/** A semantic text or status font token. */
export type IconColor = FontColor<keyof typeof textIconColors> | keyof typeof statusColors;

export const iconSizes = [12, 15, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48, 60, 64] as const;

type IconPixels = (typeof iconSizes)[number];

/** A step of the icon scale, by its name or by the number of pixels it stands for. */
export type IconSize = IconPixels | `x${IconPixels}`;

/** A glyph of the icon set. It is decorative unless the caller gives it a role and a name. */
export type IconContract = CommonAttributes & {
	name: IconName;
	/** Without it, the icon takes the size of the text around it. */
	size?: IconSize;
	/** Without it, the icon takes the colour of the text around it. */
	color?: IconColor;
	role?: AriaRole;
} & Pick<AriaAttributes, 'aria-hidden' | 'aria-label' | 'aria-labelledby' | 'aria-describedby'>;
