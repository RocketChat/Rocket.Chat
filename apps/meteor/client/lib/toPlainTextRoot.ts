import type { Root } from '@rocket.chat/message-parser';

/**
 * Builds a `Root` that renders `text` verbatim.
 *
 * Line breaks are not part of the text a renderer receives: the parser turns them into structure
 * (one `PARAGRAPH` per line, a `LINE_BREAK` per blank line), and HTML collapses any `\n` left inside
 * a text node. So messages that skip parsing (the ones past `MESSAGE_MAX_PARSE_LENGTH`) have to be
 * mapped to the same structure, or they render as a single line.
 */
export const toPlainTextRoot = (text: string): Root => {
	if (!text) {
		return [];
	}

	// `marked` and `message-parser` both normalize line endings before parsing; without this a message
	// pasted from Windows keeps a stray `\r` at the end of every line.
	const lines = text.replace(/\r\n?/g, '\n').split('\n');

	if (lines.length > 1 && lines[lines.length - 1] === '') {
		lines.pop();
	}

	return lines.map((line) =>
		line ? { type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: line }] } : { type: 'LINE_BREAK', value: undefined },
	) as Root;
};
