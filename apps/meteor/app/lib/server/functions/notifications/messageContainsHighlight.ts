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

	const leftBoundary = '(?<=^|[^\\p{L}\\p{N}_])';
	const rightBoundary = '(?=$|[^\\p{L}\\p{N}_])';

	return highlights.some((highlight: string) => {
		// Due to unnecessary escaping in escapeRegExp, we need to remove the escape character for the following characters: - = ! :
		// This is necessary because it was crashing the client due to Invalid regular expression error.
		const hl = escapeRegExp(highlight).replace(/\\([-=!:])/g, '$1');
		const pattern =
			`(?<!:)${leftBoundary}${hl}${rightBoundary}:` +
			`|:${leftBoundary}${hl}${rightBoundary}(?!:)` +
			`|${leftBoundary}(?<!:)${hl}(?!:)${rightBoundary}`;
		const regexp = new RegExp(pattern, 'iu');
		return regexp.test(message.msg);
	});
}
