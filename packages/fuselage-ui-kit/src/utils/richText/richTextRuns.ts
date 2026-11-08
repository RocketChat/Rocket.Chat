import type * as MessageParser from '@rocket.chat/message-parser';
import type * as UiKit from '@rocket.chat/ui-kit';

import type { MentionNames } from './richTextToAst';
import { containerToAst, inlineToAst, isCustomInline } from './richTextToAst';

export type RichTextPart =
	{ kind: 'markup'; tokens: MessageParser.Root } | { kind: 'custom'; element: UiKit.RichTextTagElement | UiKit.RichTextCitationElement };

export type RichTextRun =
	| { kind: 'markup'; tokens: Array<MessageParser.Paragraph | MessageParser.Blocks> }
	| { kind: 'mixed'; container: 'section' | 'quote' | 'bullet' | 'ordered'; lines: RichTextPart[][] };

const toParts = (elements: UiKit.RichTextInlineElement[], names: MentionNames): RichTextPart[] => {
	const parts: RichTextPart[] = [];
	let pending: MessageParser.Inlines[] = [];

	const flush = () => {
		if (pending.length) parts.push({ kind: 'markup', tokens: [{ type: 'PARAGRAPH', value: pending }] });
		pending = [];
	};

	for (const element of elements) {
		if (isCustomInline(element)) {
			flush();
			parts.push({ kind: 'custom', element });
		} else {
			pending.push(inlineToAst(element, names));
		}
	}
	flush();

	return parts;
};

const mixedLines = (
	container: UiKit.RichTextContainer,
): (Pick<Extract<RichTextRun, { kind: 'mixed' }>, 'container'> & { lines: UiKit.RichTextInlineElement[][] }) | undefined => {
	switch (container.type) {
		case 'rich_text_section':
			return { container: 'section', lines: [container.elements] };
		case 'rich_text_quote':
			return { container: 'quote', lines: [container.elements] };
		case 'rich_text_list':
			return { container: container.style === 'ordered' ? 'ordered' : 'bullet', lines: container.elements.map((item) => item.elements) };
		case 'rich_text_preformatted':
			return undefined;
	}
};

/**
 * Splits a rich text into runs that gazzodown draws and runs holding elements it cannot draw (tags, citations).
 * Containers without such elements stay together in one `markup` run, so they render as before.
 */
export const richTextToRuns = (block: Pick<UiKit.RichTextBlock, 'elements'>, names: MentionNames): RichTextRun[] => {
	const runs: RichTextRun[] = [];

	for (const container of block.elements) {
		const mixed = mixedLines(container);

		if (mixed?.lines.some((line) => line.some(isCustomInline))) {
			runs.push({ kind: 'mixed', container: mixed.container, lines: mixed.lines.map((line) => toParts(line, names)) });
			continue;
		}

		const node = containerToAst(container, names);
		const last = runs[runs.length - 1];
		if (last?.kind === 'markup') last.tokens = [...last.tokens, node];
		else runs.push({ kind: 'markup', tokens: [node] });
	}

	return runs;
};
