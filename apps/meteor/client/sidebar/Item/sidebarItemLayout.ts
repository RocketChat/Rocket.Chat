import type { SidebarAvatarSize, SidebarViewMode } from '../hooks/useSidebarDisplayPreferences';

export const SIDEBAR_ITEM_AVATAR_SIZE: Record<SidebarAvatarSize, 'x20' | 'x28' | 'x36'> = {
	small: 'x20',
	medium: 'x28',
	large: 'x36',
};

const AVATAR_PX: Record<SidebarAvatarSize, number> = { small: 20, medium: 28, large: 36 };

// Height of what sits between the vertical paddings: a single line is 20px; with the preview, the title (20) sits
// over the preview text (16), plus the space between them.
const SINGLE_LINE_HEIGHT = 20;
const TWO_LINES_HEIGHT = 36;

/**
 * Space above the preview line, in px (0.25rem). Condensed drops it when the avatar has its own column (medium or
 * large), so the two lines stay packed next to it.
 */
export const getSidebarPreviewGap = (viewMode: SidebarViewMode, avatarSize: SidebarAvatarSize | undefined): number =>
	viewMode === 'condensed' && avatarSize && avatarSize !== 'small' ? 0 : 4;

// Breathing room inside a row, around its content. With the preview, both view modes use the same 6px.
const PADDING_BLOCK: Record<SidebarViewMode, { single: number; withPreview: number }> = {
	condensed: { single: 4, withPreview: 6 },
	extended: { single: 6, withPreview: 6 },
};

// Space between one row and the next, split above and below each row. It is what sets Extended apart from Condensed.
const ITEM_GAP: Record<SidebarViewMode, number> = {
	condensed: 0,
	extended: 4,
};

export const getSidebarItemGap = (viewMode: SidebarViewMode): number => ITEM_GAP[viewMode];

export type SidebarItemLayout = { height: number; paddingBlock: number };

/** A row is as tall as its content or its avatar, whichever is taller, plus the view mode's padding. */
export const getSidebarItemLayout = (
	viewMode: SidebarViewMode,
	displayPreview: boolean,
	avatarSize: SidebarAvatarSize | undefined,
): SidebarItemLayout => {
	const key = displayPreview ? 'withPreview' : 'single';
	const paddingBlock = PADDING_BLOCK[viewMode][key];
	const contentHeight = displayPreview ? TWO_LINES_HEIGHT + getSidebarPreviewGap(viewMode, avatarSize) : SINGLE_LINE_HEIGHT;
	const content = Math.max(contentHeight, avatarSize ? AVATAR_PX[avatarSize] : 0);
	return { height: content + paddingBlock * 2, paddingBlock };
};

export const getSidebarItemHeight = (...args: Parameters<typeof getSidebarItemLayout>): number => getSidebarItemLayout(...args).height;
