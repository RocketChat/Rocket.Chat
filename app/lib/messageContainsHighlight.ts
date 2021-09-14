import { escapeRegExp } from '@rocket.chat/string-helpers';

/**
 * Checks if a message contains a user highlight
 *
 * @param {string} message
 * @param {array|undefined} highlights
 *
 * @returns {boolean}
 */
export function messageContainsHighlight(message: string, highlights: string[] | undefined): boolean {
	if (! highlights || highlights.length === 0) { return false; }

	return highlights.some(function(highlight) {
		const regexp = new RegExp(escapeRegExp(highlight), 'i');
		return regexp.test(message);
	});
}
