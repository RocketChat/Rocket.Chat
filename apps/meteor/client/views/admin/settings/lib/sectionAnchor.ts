export const getSectionAnchorId = (groupId: string, sectionName: string): string =>
	`settings-section-${groupId}-${sectionName || 'default'}`.replace(/[^a-zA-Z0-9-_]/g, '-');
