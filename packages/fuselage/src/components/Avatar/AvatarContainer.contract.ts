import type { AriaAttributes, AriaRole, ReactNode } from 'react';

import type { CommonAttributes, PressEvents } from '../../types/Attributes.contract';

export type AvatarSize = 'x16' | 'x18' | 'x20' | 'x24' | 'x28' | 'x32' | 'x36' | 'x40' | 'x48' | 'x124' | 'x200' | 'x332';

export type AvatarAccessibilityAttributes = {
	role?: AriaRole;
} & Pick<AriaAttributes, 'aria-label' | 'aria-labelledby' | 'aria-describedby' | 'aria-hidden' | 'aria-haspopup'>;

export type AvatarContainerContract = CommonAttributes &
	AvatarAccessibilityAttributes &
	PressEvents & {
		size?: AvatarSize;
		children?: ReactNode;
	};
