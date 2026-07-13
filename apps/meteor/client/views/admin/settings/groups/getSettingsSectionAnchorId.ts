/**
 * Builds a stable DOM id for a settings section so the in-page section
 * navigation can scroll to it. Section names may be empty (top-level
 * settings) or contain spaces/special characters.
 */
export const getSettingsSectionAnchorId = (groupId: string, sectionName: string): string =>
	`settings-${groupId}-${(sectionName || 'general').replace(/[^A-Za-z0-9]+/g, '-').toLowerCase()}`;
