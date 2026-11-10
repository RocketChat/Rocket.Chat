import type { OutlookAddInManifestStrings, OutlookAddInPaneStrings } from './outlookAddInStrings';
import { OUTLOOK_ADDIN_MANIFEST_STRINGS, OUTLOOK_ADDIN_PANE_STRINGS } from './outlookAddInStrings';
import { settings } from '../settings';

/** The webmail origins allowed to show the add-in; empty leaves it as unframeable as the rest of the workspace. */
export const getOutlookAddInFrameOrigins = (): string[] =>
	(settings.get<string>('Pexip_Integration_Outlook_AddIn_Frame_Origins') || '')
		.split(/[\s,]+/)
		.map((origin) => origin.trim())
		.filter(Boolean);

/** An admin clearing a string gets the default back rather than a blank label. */
const readStrings = <T extends Record<string, { settingId: string; defaultValue: string }>>(table: T): Record<keyof T, string> =>
	Object.fromEntries(
		Object.entries(table).map(([key, { settingId, defaultValue }]) => [key, settings.get<string>(settingId) || defaultValue]),
	) as Record<keyof T, string>;

export const getOutlookAddInManifestStrings = (): OutlookAddInManifestStrings => readStrings(OUTLOOK_ADDIN_MANIFEST_STRINGS);

export const getOutlookAddInPaneStrings = (): OutlookAddInPaneStrings => readStrings(OUTLOOK_ADDIN_PANE_STRINGS);
