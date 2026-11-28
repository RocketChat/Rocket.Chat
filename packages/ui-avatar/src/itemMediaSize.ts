import type { AvatarProps } from '@rocket.chat/fuselage';

export type ItemMediaSizeName = 'condensed' | 'medium' | 'extended';

/**
 * The avatar size an `ItemMedia` holds at each list density, matching the sidebar view modes.
 */
export const ITEM_MEDIA_SIZE = {
	condensed: 'x20',
	medium: 'x28',
	extended: 'x36',
} as const satisfies Record<ItemMediaSizeName, AvatarProps['size']>;
