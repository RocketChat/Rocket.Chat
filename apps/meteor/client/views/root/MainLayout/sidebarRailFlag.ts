declare global {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Window {
		USE_SIDEBAR_RAIL?: boolean;
	}
}

/**
 * Feature flag for the collapsed SidebarRail navigation.
 *
 * Exposed on `window` so it can be toggled at runtime without a rebuild — e.g. from an
 * admin custom script:
 *
 *   window.USE_SIDEBAR_RAIL = true;
 *
 * Read on every render, so the value applies on the next page load after being set.
 * Defaults to `false`.
 */
export const isSidebarRailEnabled = (): boolean => window.USE_SIDEBAR_RAIL ?? false;
