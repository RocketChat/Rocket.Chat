import { stripHtml } from 'string-strip-html';

/**
 * Turns an email's html into its text/plain alternative, keeping each link's address so readers without html can still follow it.
 */
export const htmlToPlainText = (html: string): string =>
	stripHtml(html, {
		dumpLinkHrefsNearby: {
			enabled: true,
			putOnNewLine: false,
			wrapHeads: '(',
			wrapTails: ')',
		},
	}).result;
