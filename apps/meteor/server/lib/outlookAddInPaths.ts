/** Everything the Outlook add-in loads lives under this path, both its static page and its manifest. */
export const OUTLOOK_ADDIN_PATH = '/outlook-addin/';

/** Office.js may only be loaded from Microsoft's CDN; an add-in bundling its own copy is rejected by Outlook. */
export const OFFICE_JS_ORIGIN = 'https://appsforoffice.microsoft.com';

export const isOutlookAddInPath = (pathname: string): boolean => pathname.startsWith(OUTLOOK_ADDIN_PATH);
