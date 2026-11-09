import { settings } from '../settings';

/** Everything the Outlook add-in loads lives under this path, both its static page and its manifest. */
export const OUTLOOK_ADDIN_PATH = '/outlook-addin/';

/** Office.js may only be loaded from Microsoft's CDN; an add-in bundling its own copy is rejected by Outlook. */
export const OFFICE_JS_ORIGIN = 'https://appsforoffice.microsoft.com';

export const isOutlookAddInPath = (pathname: string): boolean => pathname.startsWith(OUTLOOK_ADDIN_PATH);

/** The webmail origins allowed to show the add-in; empty leaves it as unframeable as the rest of the workspace. */
export const getOutlookAddInFrameOrigins = (): string[] =>
	(settings.get<string>('Pexip_Integration_Outlook_AddIn_Frame_Origins') || '')
		.split(/[\s,]+/)
		.map((origin) => origin.trim())
		.filter(Boolean);
