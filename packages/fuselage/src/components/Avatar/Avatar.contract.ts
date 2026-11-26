import type { AvatarAccessibilityAttributes, AvatarSize } from './AvatarContainer.contract';
import type { CommonAttributes, PressEvents } from '../../types/Attributes.contract';

export type AvatarObjectFit = 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';

export type AvatarContract = CommonAttributes &
	AvatarAccessibilityAttributes &
	PressEvents & {
		size?: AvatarSize;
		rounded?: boolean;
		objectFit?: AvatarObjectFit;
		url: string;
		alt?: string;
	};
