/** Dresses every Storybook built on this config in the Fuselage theme picked from the toolbar. */
export const managerEntries = (entries: string[] = []): string[] => [...entries, require.resolve('./manager')];

export const previewAnnotations = (entries: string[] = []): string[] => [...entries, require.resolve('./globals')];
