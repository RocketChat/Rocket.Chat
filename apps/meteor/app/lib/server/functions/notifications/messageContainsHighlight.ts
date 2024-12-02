import type { IMessage } from '@rocket.chat/core-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';

/**
 * Checks if a message contains a user highlight
 *
 * @param {string} message
 * @param {array|undefined} highlights
 *
 * @returns {boolean}
 */
export function messageContainsHighlight(message: Pick<IMessage, 'msg'>, highlights: string[] | undefined): boolean {
	if (!highlights || highlights.length === 0) {
		return false;
	}

	return highlights.some((highlight: string) => {
		const hl = escapeRegExp(highlight);
		const regexp = new RegExp(`(?<!:)\\b${hl}\\b:|:\\b${hl}(?!:)\\b|\\b(?<!:)${hl}(?!:)\\b`, 'i');
		return regexp.test(message.msg);
	});
}
