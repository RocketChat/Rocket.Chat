import type * as MessageParser from '@rocket.chat/message-parser';

import { blockSourceOf } from './sourceOf';

type Block = MessageParser.Root[number];

type ListEntry = MessageParser.ListItem | MessageParser.Task;

// A list item covers its own line plus every line of the lists nested under it.
const itemLineSpanOf = ({ nested }: ListEntry): number =>
	1 + (nested ?? []).reduce((span, list) => span + list.value.reduce((sum, item) => sum + itemLineSpanOf(item), 0), 0);

// How many source lines a block covers, so the next block can be lined up with the line it started
// on.
const lineSpanOf = (block: Block, source: string): number => {
	switch (block.type) {
		case 'QUOTE':
			return block.value.length;

		case 'TASKS':
		case 'UNORDERED_LIST':
		case 'ORDERED_LIST':
			return block.value.reduce((span: number, item: ListEntry) => span + itemLineSpanOf(item), 0);

		case 'CODE':
		case 'SPOILER_BLOCK':
			return block.value.length + 1;

		case 'HORIZONTAL_RULE':
		case 'TABLE':
			return (blockSourceOf(block, source).match(/\n/g) ?? []).length;

		case 'BIG_EMOJI':
			return 0;

		default:
			return 1;
	}
};

// A quote line's `>` and a blank line's spaces are both eaten by the grammar and kept nowhere in the
// AST, yet the composer has to reprint them character for character. Hands each block the source
// lines it was parsed from so it can read them back.
export const sourceLinesOf = (tokens: MessageParser.Root, source: string): string[][] => {
	const lines = source.split('\n');
	let line = 0;

	return tokens.map((block) => {
		const span = lineSpanOf(block, source);
		const own = lines.slice(line, line + span);

		line += span;

		return own;
	});
};

// Hands each item of a list block the source text of the lists nested under it, since their
// indentation is kept nowhere in the AST.
export const nestedSourceOf = (items: ListEntry[], lines: string[]): string[] => {
	let line = 0;

	return items.map((item) => {
		const span = itemLineSpanOf(item);
		const own = lines.slice(line + 1, line + span);

		line += span;

		return own.map((nested) => `${nested}\n`).join('');
	});
};
