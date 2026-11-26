import type { ReactNode } from 'react';

import type { AvatarAccessibilityAttributes } from './AvatarContainer.contract';
import type { CommonAttributes, PressEvents } from '../../types/Attributes.contract';

export type AvatarStackContract = CommonAttributes &
	AvatarAccessibilityAttributes &
	PressEvents & {
		children?: ReactNode;
	};
