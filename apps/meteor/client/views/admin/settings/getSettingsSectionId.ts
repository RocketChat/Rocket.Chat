/**
 * Derives a stable DOM id for a settings section so the table-of-contents rail
 * can anchor-scroll to it. Kept in one place so the section card and the TOC
 * always agree on the id.
 */
export const getSettingsSectionId = (groupId: string, sectionName: string | undefined): string =>
	`settings-section-${groupId}-${(sectionName || 'default').replace(/[^a-zA-Z0-9_-]+/g, '-')}`.toLowerCase();
