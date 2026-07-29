import type { Root } from '@rocket.chat/message-parser';

export const toPlainTextRoot = (text: string): Root =>
	text
		.split('\n')
		.map((line) =>
			line ? { type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: line }] } : { type: 'LINE_BREAK', value: undefined },
		) as Root;
