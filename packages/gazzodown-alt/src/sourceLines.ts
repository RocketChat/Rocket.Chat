import type * as MessageParser from '@rocket.chat/message-parser';

import { blockSourceOf } from './sourceOf';

type Block = MessageParser.Root[number];

// How many source lines a block covers, so the next block can be lined up with the line it started
// on.
const lineSpanOf = (block: Block, source: string): number => {
	switch (block.type) {
		case 'QUOTE':
		case 'TASKS':
		case 'UNORDERED_LIST':
		case 'ORDERED_LIST':
			return block.value.length;

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
