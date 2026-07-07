export type SidebarViewMode = 'extended' | 'condensed';

/**
 * The legacy "medium" display mode was removed from the display menu (it used to be the default). Accounts
 * still storing it fall back to "condensed" (Compact). Any other value — including `undefined` — passes through
 * unchanged, so each caller keeps its own default.
 */
export const normalizeSidebarViewMode = (mode: 'extended' | 'medium' | 'condensed' | undefined): SidebarViewMode | undefined =>
	mode === 'medium' ? 'condensed' : mode;
