import { settings } from '../settings';

/** The webmail origins allowed to show the add-in; empty leaves it as unframeable as the rest of the workspace. */
export const getOutlookAddInFrameOrigins = (): string[] =>
	(settings.get<string>('Pexip_Integration_Outlook_AddIn_Frame_Origins') || '')
		.split(/[\s,]+/)
		.map((origin) => origin.trim())
		.filter(Boolean);
