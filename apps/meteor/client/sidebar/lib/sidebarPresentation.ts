export type SidebarViewMode = 'extended' | 'medium' | 'condensed';

/** How this reader wants the room list drawn, said in data so anything can draw it. */
export type SidebarPresentation = {
	viewMode: SidebarViewMode;
	extended: boolean;
	showAvatar: boolean;
	/** What one row occupies, which a virtual list needs before it has drawn any. */
	rowHeight: number;
};

export const rowHeightByViewMode: Record<SidebarViewMode, number> = {
	condensed: 28,
	medium: 36,
	extended: 48,
};
